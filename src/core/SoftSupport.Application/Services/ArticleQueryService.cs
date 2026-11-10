using Microsoft.Extensions.Logging;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.Interfaces.Repositories;
using SoftSupport.Application.Interfaces.Services;

namespace SoftSupport.Application.Services;

public sealed class ArticleQueryService(
    IArticleReadRepository reads,
    IArticleRepository articles,
    ICrmGateway crm,
    ILogger<ArticleQueryService> logger) : IArticleQueryService
{
    private const int RecentCount = 20;

    public Task<PagedResult<ArticleListItemDto>> SearchAsync(ArticlesQuery query, CancellationToken cancellationToken) =>
        reads.SearchAsync(query, cancellationToken);

    public Task<ArticleStatsDto> GetStatsAsync(CancellationToken cancellationToken) => reads.GetStatsAsync(cancellationToken);

    public Task<IReadOnlyList<ArticleListItemDto>> GetRecentAsync(CancellationToken cancellationToken) =>
        reads.GetRecentAsync(RecentCount, cancellationToken);

    public async Task<ArticleDetailDto> OpenAsync(int articleId, CancellationToken cancellationToken)
    {
        var article = await articles.FindAsync(articleId, cancellationToken)
            ?? throw new KeyNotFoundException("Article introuvable.");
        article.RegisterView();
        await articles.SaveChangesAsync(cancellationToken);

        var (detail, crmAssignedUser) = await reads.GetDetailAsync(articleId, cancellationToken)
            ?? throw new KeyNotFoundException("Article introuvable.");

        // Un article importé est attribué à l'intervenant du cas CRM d'origine.
        if (detail.InCrm && crmAssignedUser is { } crmUserId)
        {
            try
            {
                var crmName = await crm.GetUserFirstNameAsync(crmUserId, cancellationToken);
                if (!string.IsNullOrWhiteSpace(crmName))
                {
                    detail = detail with { AuthorName = crmName };
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogWarning(exception, "CRM indisponible : auteur de l'article {ArticleId} non résolu", articleId);
            }
        }

        return detail;
    }

    public Task<ArticleReferencesDto> GetReferencesAsync(CancellationToken cancellationToken) =>
        reads.GetReferencesAsync(cancellationToken);
}