using SoftSupport.Application.DTOs.Catalog;

namespace SoftSupport.Application.Interfaces.Services;

public interface IThemeService
{
    Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int themeId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int themeId, SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int themeId, CancellationToken cancellationToken);
}