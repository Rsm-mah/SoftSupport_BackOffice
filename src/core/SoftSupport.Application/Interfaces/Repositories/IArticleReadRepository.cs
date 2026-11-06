using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IArticleReadRepository
{
    Task<PagedResult<ArticleListItemDto>> SearchAsync(ArticlesQuery query, CancellationToken cancellationToken);

    Task<ArticleStatsDto> GetStatsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleListItemDto>> GetRecentAsync(int take, CancellationToken cancellationToken);

    Task<(ArticleDetailDto Article, int? CrmAssignedUser)?> GetDetailAsync(int articleId, CancellationToken cancellationToken);

    Task<IReadOnlyList<MyArticleDto>> GetByAuthorAsync(string userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<RefusedArticleDto>> GetRefusedByAuthorAsync(string userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<PendingArticleDto>> GetPendingAsync(
        IReadOnlyCollection<int> departementIds,
        CancellationToken cancellationToken);

    Task<int> CountPendingAsync(IReadOnlyCollection<int> departementIds, CancellationToken cancellationToken);

    Task<EditableArticleRow?> GetEditableAsync(int articleId, CancellationToken cancellationToken);

    Task<ArticleReferencesDto> GetReferencesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleExportRow>> GetExportRowsAsync(
        DateTime from,
        DateTime toExclusive,
        int departementId,
        CancellationToken cancellationToken);
}