using SoftSupport.Application.Interfaces.Repositories;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

internal static class ArticleContentBuilder
{
    public static async Task<ArticleContent> BuildAsync(
        IArticleRepository articles,
        string title,
        string problem,
        string solution,
        int? productId,
        int? versionId,
        int? themeId,
        string? ticketNumber,
        string? requestNumber,
        CancellationToken cancellationToken)
    {
        var (productName, versionName) = await articles.GetDesignationPartsAsync(productId, versionId, cancellationToken);
        return new ArticleContent(
            title.Trim(),
            problem,
            solution,
            ArticleCode.Designation(productName, versionName, title),
            productId,
            versionId,
            themeId,
            Clean(ticketNumber),
            Clean(requestNumber));
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
