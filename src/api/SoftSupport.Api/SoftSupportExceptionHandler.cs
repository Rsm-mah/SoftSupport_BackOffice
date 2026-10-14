using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.Common;
using SoftSupport.Domain;

namespace SoftSupport.Api;

public sealed class SoftSupportExceptionHandler(ILogger<SoftSupportExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var status = exception switch
        {
            SqlException or TimeoutException => StatusCodes.Status503ServiceUnavailable,
            SoftSupportAuthenticationException => StatusCodes.Status401Unauthorized,
            UnauthorizedAccessException => StatusCodes.Status403Forbidden,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            ValidationException or FormatException or ArgumentException => StatusCodes.Status400BadRequest,
            DbUpdateConcurrencyException or SoftSupportConflictException => StatusCodes.Status409Conflict,
            SoftSupportDomainException => StatusCodes.Status422UnprocessableEntity,
            _ => StatusCodes.Status500InternalServerError,
        };

        if (status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Erreur SoftSupport. TraceId={TraceId}", context.TraceIdentifier);
        }

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(
            ApiResponse<object?>.Fail(ResolveMessage(status, exception)),
            cancellationToken);
        return true;
    }

    private static string ResolveMessage(int status, Exception exception) =>
        status switch
        {
            StatusCodes.Status500InternalServerError => "Désolé, une erreur s'est produite.",
            StatusCodes.Status503ServiceUnavailable => "La base de données (BDC ou CRM) est temporairement indisponible.",
            _ => exception.Message,
        };
}
