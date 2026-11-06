using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.Interfaces.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CategoryDetailDto> GetDetailAsync(int categoryId, CancellationToken cancellationToken);

    Task<IReadOnlyList<LookupDto>> GetAssignableProductsAsync(int? categoryId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveCategoryRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int categoryId, SaveCategoryRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int categoryId, CancellationToken cancellationToken);
}