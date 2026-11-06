using SoftSupport.Application.DTOs.Articles;

namespace SoftSupport.Application.Interfaces.Services;

public interface IArticleValidationService
{
    Task<PendingCountDto> CountPendingAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<PendingArticleDto>> GetPendingAsync(CancellationToken cancellationToken);

    Task<EditableArticleDto> GetForValidationAsync(int articleId, CancellationToken cancellationToken);

    Task<string> ValidateAsync(int articleId, ValidateArticleRequest request, CancellationToken cancellationToken);

    Task<string> DenyAsync(int articleId, ArticleCommentRequest request, CancellationToken cancellationToken);

    Task<string> RemoveAsync(int articleId, ArticleCommentRequest request, CancellationToken cancellationToken);

    Task<string> ImportFromCrmAsync(CancellationToken cancellationToken);
}