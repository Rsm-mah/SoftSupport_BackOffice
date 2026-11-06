using SoftSupport.Application.DTOs.Catalog;

namespace SoftSupport.Application.Interfaces.Services;

public interface IVersionService
{
    Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int versionId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int versionId, SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int versionId, CancellationToken cancellationToken);

    Task<string> ImportFromCrmAsync(CancellationToken cancellationToken);
}