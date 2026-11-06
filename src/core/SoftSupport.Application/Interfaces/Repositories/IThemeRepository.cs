using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IThemeRepository
{
    Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<Theme?> FindAsync(int themeId, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int themeId, CancellationToken cancellationToken);

    Task AddAsync(Theme theme, CancellationToken cancellationToken);

    void Remove(Theme theme);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}