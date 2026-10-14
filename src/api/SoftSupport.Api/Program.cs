using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.AspNetCore;
using Serilog.Events;
using SoftSupport.Api;
using SoftSupport.Api.Security;
using SoftSupport.Application;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.Common;
using SoftSupport.Infrastructure;
using SoftSupport.Infrastructure.Security;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog(ConfigureSerilog);
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddSoftSupportApplication();
    builder.Services.AddSoftSupportInfrastructure(builder.Configuration);
    builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();
    builder.Services.AddExceptionHandler<SoftSupportExceptionHandler>();
    builder.Services.AddProblemDetails();
    builder.Services.AddScoped<SoftSupportValidationFilter>();

    builder.Services.AddControllers(options => options.Filters.AddService<SoftSupportValidationFilter>())
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });
    builder.Services.Configure<ApiBehaviorOptions>(options =>
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value is { Errors.Count: > 0 })
                .ToDictionary(
                    entry => string.IsNullOrWhiteSpace(entry.Key) ? "request" : entry.Key,
                    entry => (object?)entry.Value!.Errors
                        .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage) ? "Valeur invalide." : error.ErrorMessage)
                        .Distinct()
                        .ToArray());
            return new BadRequestObjectResult(ApiResponse<object?>.Fail("La requête SoftSupport est invalide.", errors));
        });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo { Title = "SoftSupport API", Version = "v1" });
        options.CustomSchemaIds(type => type.FullName?.Replace("+", ".", StringComparison.Ordinal));
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
        });
        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = [],
        });
    });

    var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
    if (string.IsNullOrWhiteSpace(jwt.Key) || Encoding.UTF8.GetByteCount(jwt.Key) < 32)
    {
        throw new InvalidOperationException("Jwt:Key est obligatoire (32 caractères minimum).");
    }

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.Zero,
            NameClaimType = SoftSupportClaims.FirstName,
            RoleClaimType = SoftSupportClaims.RoleName,
        };
        options.Events = new JwtBearerEvents
        {
            OnChallenge = context =>
            {
                context.HandleResponse();
                return SoftSupportApiResponseWriter.WriteErrorAsync(
                    context.HttpContext,
                    StatusCodes.Status401Unauthorized,
                    "Authentification requise.",
                    context.HttpContext.RequestAborted);
            },
            OnForbidden = context => SoftSupportApiResponseWriter.WriteErrorAsync(
                context.HttpContext,
                StatusCodes.Status403Forbidden,
                "Accès refusé.",
                context.HttpContext.RequestAborted),
        };
    });
    builder.Services.AddSoftSupportAuthorization();

    var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
    if (origins.Length == 0)
    {
        throw new InvalidOperationException("Au moins une origine Cors:Origins est obligatoire.");
    }

    builder.Services.AddCors(options => options.AddPolicy("SoftSupportCors", policy => policy
        .WithOrigins(origins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithExposedHeaders("Content-Disposition")));
    builder.Services.AddHealthChecks();
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.Providers.Add<BrotliCompressionProvider>();
        options.Providers.Add<GzipCompressionProvider>();
    });

    var app = builder.Build();
    app.UseSerilogRequestLogging(ConfigureRequestLogging);
    app.UseResponseCompression();
    app.UseExceptionHandler();
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("SoftSupportCors");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health").AllowAnonymous();
    app.MapGet("/", () => Results.Redirect("/swagger/index.html")).AllowAnonymous();
    await app.RunAsync();
}
catch (Exception exception) when (exception is not HostAbortedException)
{
    Log.Fatal(exception, "SoftSupport API s'est arrêtée de façon inattendue.");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}

static void ConfigureSerilog(HostBuilderContext context, LoggerConfiguration configuration)
{
    var logDirectory = context.Configuration["Serilog:LogDirectory"];
    if (string.IsNullOrWhiteSpace(logDirectory))
    {
        logDirectory = Path.Combine(context.HostingEnvironment.ContentRootPath, "logs");
    }

    configuration
        .ReadFrom.Configuration(context.Configuration)
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
        // Le middleware journalise toute exception en erreur, y compris un simple mot de passe
        // refusé ; SoftSupportExceptionHandler journalise lui-même les vraies erreurs (500).
        .MinimumLevel.Override("Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddleware", LogEventLevel.Fatal)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(
            Path.Combine(logDirectory, "softsupport-.log"),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            shared: true);
}

static void ConfigureRequestLogging(RequestLoggingOptions options)
{
    options.MessageTemplate = "SoftSupport HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
}

public partial class Program;
