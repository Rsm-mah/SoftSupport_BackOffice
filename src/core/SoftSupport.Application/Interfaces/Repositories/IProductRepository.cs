using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IProductRepository
{
    Task<IReadOnlyList<ProductListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<LookupDto>> GetLookupAsync(CancellationToken cancellationToken);

    Task<Product?> FindAsync(int productId, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken);

    Task<bool> CategoryExistsAsync(int categoryId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int productId, CancellationToken cancellationToken);

    Task<bool> HasContractsAsync(int productId, CancellationToken cancellationToken);

    Task<bool> IsInPackAsync(int productId, CancellationToken cancellationToken);

    Task<int> CountExistingAsync(IReadOnlyCollection<int> productIds, CancellationToken cancellationToken);

    Task<List<Product>> GetCrmProductsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<PackDto>> GetPacksAsync(CancellationToken cancellationToken);

    Task<List<ProductPack>> GetPackLinksAsync(int productId, CancellationToken cancellationToken);

    Task AddAsync(Product product, CancellationToken cancellationToken);

    void Remove(Product product);

    void AddPackLink(ProductPack link);

    void RemovePackLinks(IEnumerable<ProductPack> links);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}