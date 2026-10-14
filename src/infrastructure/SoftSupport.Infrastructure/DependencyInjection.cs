using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SoftSupport.Application;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.Interfaces;
using SoftSupport.Infrastructure.Crm;
using SoftSupport.Infrastructure.Jobs;
using SoftSupport.Infrastructure.Mail;
using SoftSupport.Infrastructure.Persistence;
using SoftSupport.Infrastructure.Repositories;
using SoftSupport.Infrastructure.Security;

namespace SoftSupport.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddSoftSupportInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connection = configuration.GetConnectionString("SoftSupportConnection");
        if (string.IsNullOrWhiteSpace(connection))
        {
            throw new InvalidOperationException("La chaîne 'SoftSupportConnection' (base BDC) est obligatoire.");
        }

        var crmConnection = configuration.GetConnectionString("CrmConnection");
        if (string.IsNullOrWhiteSpace(crmConnection))
        {
            throw new InvalidOperationException("La chaîne 'CrmConnection' (base CRMSOFTWELL) est obligatoire.");
        }

        services.AddDbContext<SoftSupportDbContext>(options =>
            options.UseSqlServer(connection, sql => sql.EnableRetryOnFailure()));
        services.AddDbContext<CrmDbContext>(options =>
            options.UseSqlServer(crmConnection, sql => sql.CommandTimeout(30)));

        services.Configure<SoftSupportOptions>(configuration.GetSection(SoftSupportOptions.SectionName));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<PasswordOptions>(configuration.GetSection(PasswordOptions.SectionName));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IReferentielRepository, ReferentielRepository>();
        services.AddScoped<IArticleRepository, ArticleRepository>();
        services.AddScoped<IArticleReadRepository, ArticleReadRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IThemeRepository, ThemeRepository>();
        services.AddScoped<IVersionRepository, VersionRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<ICrmGateway, CrmGateway>();

        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<IAccessTokenFactory, JwtAccessTokenFactory>();

        services.AddSingleton<ChannelEmailQueue>();
        services.AddSingleton<IEmailQueue>(provider => provider.GetRequiredService<ChannelEmailQueue>());
        services.AddHostedService<EmailDispatcherBackgroundService>();
        services.AddHostedService<ContractAlertBackgroundService>();

        return services;
    }
}
