using SoftSupport.Application.DTOs.Articles;

namespace SoftSupport.Application.Interfaces.Services;

public interface IArticleAuthoringService
{
    Task<IReadOnlyList<MyArticleDto>> GetMineAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<RefusedArticleDto>> GetMyRefusedAsync(CancellationToken cancellationToken);

    Task<EditableArticleDto> GetEditableAsync(int articleId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveArticleRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int articleId, SaveArticleRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int articleId, CancellationToken cancellationToken);

    Task<string> ChangeOptionsAsync(int articleId, ArticleOptionsRequest request, CancellationToken cancellationToken);

    Task<string> SendBackToValidationAsync(int articleId, CancellationToken cancellationToken);

    Task<ExportFile> ExportAsync(ArticleExportQuery query, CancellationToken cancellationToken);
}