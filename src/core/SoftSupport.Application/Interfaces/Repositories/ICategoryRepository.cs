using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<CategoryListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CategoryDetailDto?> GetDetailAsync(int categoryId, CancellationToken cancellationToken);

    Task<Category?> FindAsync(int categoryId, CancellationToken cancellationToken);

    Task<bool> CodeExistsAsync(string code, int? excludedId, CancellationToken cancellationToken);

    Task<IReadOnlyList<LookupDto>> GetAssignableProductsAsync(int? categoryId, CancellationToken cancellationToken);

    Task SetProductsAsync(int categoryId, IReadOnlyCollection<int> productIds, CancellationToken cancellationToken);

    Task AddAsync(Category category, CancellationToken cancellationToken);

    void Remove(Category category);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}