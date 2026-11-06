using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;

namespace SoftSupport.Application.Interfaces.Services;

public interface IArticleQueryService
{
    Task<PagedResult<ArticleListItemDto>> SearchAsync(ArticlesQuery query, CancellationToken cancellationToken);

    Task<ArticleStatsDto> GetStatsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleListItemDto>> GetRecentAsync(CancellationToken cancellationToken);

    Task<ArticleDetailDto> OpenAsync(int articleId, CancellationToken cancellationToken);

    Task<ArticleReferencesDto> GetReferencesAsync(CancellationToken cancellationToken);
}