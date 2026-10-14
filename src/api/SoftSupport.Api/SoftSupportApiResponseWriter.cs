using SoftSupport.Application.Common;

namespace SoftSupport.Api;

public static class SoftSupportApiResponseWriter
{
    public static Task WriteErrorAsync(
        HttpContext context,
        int statusCode,
        string message,
        CancellationToken cancellationToken)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        return context.Response.WriteAsJsonAsync(ApiResponse<object?>.Fail(message), cancellationToken);
    }
}
