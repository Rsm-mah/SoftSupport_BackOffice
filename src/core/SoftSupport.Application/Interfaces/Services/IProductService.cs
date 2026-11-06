using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.Interfaces.Services;

public interface IProductService
{
    Task<IReadOnlyList<ProductListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<LookupDto>> GetLookupAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int productId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveProductRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int productId, SaveProductRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int productId, CancellationToken cancellationToken);

    Task<string> ImportFromCrmAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<PackDto>> GetPacksAsync(CancellationToken cancellationToken);

    Task<string> SavePackAsync(int productId, SavePackRequest request, CancellationToken cancellationToken);

    Task<string> DeletePackAsync(int productId, CancellationToken cancellationToken);
}