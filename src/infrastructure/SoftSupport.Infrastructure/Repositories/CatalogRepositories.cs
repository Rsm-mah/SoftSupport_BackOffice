using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;
using SoftSupport.Infrastructure.Persistence;

namespace SoftSupport.Infrastructure.Repositories;

public sealed class ProductRepository(SoftSupportDbContext db) : IProductRepository
{
    public async Task<IReadOnlyList<ProductListItemDto>> GetListAsync(CancellationToken cancellationToken) =>
        await (from product in db.Products.AsNoTracking().Where(ProductCatalog.ListedOrLocal)
               join category in db.Categories.AsNoTracking() on product.CategoryId equals category.Id into categories
               from category in categories.DefaultIfEmpty()
               orderby product.Name
               select new ProductListItemDto(
                   product.Id,
                   product.Name,
                   product.CategoryId,
                   category != null ? category.Code : null,
                   category != null ? category.Name : null,
                   db.Articles.Count(article => article.ProductId == product.Id),
                   product.CrmId == null))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<LookupDto>> GetLookupAsync(CancellationToken cancellationToken) =>
        await db.Products.AsNoTracking()
            .Where(ProductCatalog.ListedOrLocal)
            .OrderBy(product => product.Name)
            .Select(product => new LookupDto(product.Id, product.Name))
            .ToListAsync(cancellationToken);

    public Task<Product?> FindAsync(int productId, CancellationToken cancellationToken) =>
        db.Products.FirstOrDefaultAsync(product => product.Id == productId, cancellationToken);

    public Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken) =>
        db.Products.AnyAsync(
            product => product.Name == name && (excludedId == null || product.Id != excludedId),
            cancellationToken);

    public Task<bool> CategoryExistsAsync(int categoryId, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(category => category.Id == categoryId, cancellationToken);

    public async Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int productId, CancellationToken cancellationToken) =>
        await db.Articles.AsNoTracking()
            .Where(article => article.ProductId == productId)
            .OrderBy(article => article.Code)
            .Select(article => new ArticleRefDto(article.Id, article.Code, article.Title))
            .ToListAsync(cancellationToken);

    public Task<bool> HasContractsAsync(int productId, CancellationToken cancellationToken) =>
        db.ContractLines.AnyAsync(line => line.ProductId == productId, cancellationToken);

    public Task<bool> IsInPackAsync(int productId, CancellationToken cancellationToken) =>
        db.ProductPacks.AnyAsync(
            pack => pack.ProductId == productId || pack.IncludedProductId == productId,
            cancellationToken);

    public Task<int> CountExistingAsync(IReadOnlyCollection<int> productIds, CancellationToken cancellationToken) =>
        db.Products.CountAsync(product => productIds.Contains(product.Id), cancellationToken);

    public Task<List<Product>> GetCrmProductsAsync(CancellationToken cancellationToken) =>
        db.Products.Where(product => product.CrmId != null).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PackDto>> GetPacksAsync(CancellationToken cancellationToken)
    {
        var links = await db.ProductPacks.AsNoTracking().ToListAsync(cancellationToken);
        var ids = links.SelectMany(link => new[] { link.ProductId, link.IncludedProductId }).Distinct().ToList();
        var names = await db.Products.AsNoTracking()
            .Where(product => ids.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, product => product.Name, cancellationToken);

        return links
            .GroupBy(link => link.ProductId)
            .Select(group => new PackDto(
                group.Key,
                names.GetValueOrDefault(group.Key, $"#{group.Key}"),
                group.Select(link => new LookupDto(link.IncludedProductId, names.GetValueOrDefault(link.IncludedProductId, $"#{link.IncludedProductId}")))
                    .OrderBy(item => item.Name)
                    .ToList()))
            .OrderBy(pack => pack.ProductName)
            .ToList();
    }

    public Task<List<ProductPack>> GetPackLinksAsync(int productId, CancellationToken cancellationToken) =>
        db.ProductPacks.Where(pack => pack.ProductId == productId).ToListAsync(cancellationToken);

    public async Task AddAsync(Product product, CancellationToken cancellationToken) => await db.Products.AddAsync(product, cancellationToken);

    public void Remove(Product product) => db.Products.Remove(product);

    public void AddPackLink(ProductPack link) => db.ProductPacks.Add(link);

    public void RemovePackLinks(IEnumerable<ProductPack> links) => db.ProductPacks.RemoveRange(links);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}

public sealed class ThemeRepository(SoftSupportDbContext db) : IThemeRepository
{
    public async Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken) =>
        await db.Themes.AsNoTracking()
            .OrderBy(theme => theme.Name)
            .Select(theme => new NamedItemDto(theme.Id, theme.Name, db.Articles.Count(article => article.ThemeId == theme.Id)))
            .ToListAsync(cancellationToken);

    public Task<Theme?> FindAsync(int themeId, CancellationToken cancellationToken) =>
        db.Themes.FirstOrDefaultAsync(theme => theme.Id == themeId, cancellationToken);

    public Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken) =>
        db.Themes.AnyAsync(theme => theme.Name == name && (excludedId == null || theme.Id != excludedId), cancellationToken);

    public async Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int themeId, CancellationToken cancellationToken) =>
        await db.Articles.AsNoTracking()
            .Where(article => article.ThemeId == themeId)
            .OrderBy(article => article.Code)
            .Select(article => new ArticleRefDto(article.Id, article.Code, article.Title))
            .ToListAsync(cancellationToken);

    public async Task AddAsync(Theme theme, CancellationToken cancellationToken) => await db.Themes.AddAsync(theme, cancellationToken);

    public void Remove(Theme theme) => db.Themes.Remove(theme);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}

public sealed class VersionRepository(SoftSupportDbContext db) : IVersionRepository
{
    public async Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken) =>
        await db.Versions.AsNoTracking()
            .OrderBy(version => version.Order)
            .ThenBy(version => version.Name)
            .Select(version => new NamedItemDto(version.Id, version.Name, db.Articles.Count(article => article.VersionId == version.Id)))
            .ToListAsync(cancellationToken);

    public Task<SoftwareVersion?> FindAsync(int versionId, CancellationToken cancellationToken) =>
        db.Versions.FirstOrDefaultAsync(version => version.Id == versionId, cancellationToken);

    public Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken) =>
        db.Versions.AnyAsync(version => version.Name == name && (excludedId == null || version.Id != excludedId), cancellationToken);

    public async Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int versionId, CancellationToken cancellationToken) =>
        await db.Articles.AsNoTracking()
            .Where(article => article.VersionId == versionId)
            .OrderBy(article => article.Code)
            .Select(article => new ArticleRefDto(article.Id, article.Code, article.Title))
            .ToListAsync(cancellationToken);

    public Task<List<SoftwareVersion>> GetAllTrackedAsync(CancellationToken cancellationToken) =>
        db.Versions.ToListAsync(cancellationToken);

    public async Task AddAsync(SoftwareVersion version, CancellationToken cancellationToken) => await db.Versions.AddAsync(version, cancellationToken);

    public void Remove(SoftwareVersion version) => db.Versions.Remove(version);

    public void RemoveRange(IEnumerable<SoftwareVersion> versions) => db.Versions.RemoveRange(versions);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}

public sealed class CategoryRepository(SoftSupportDbContext db) : ICategoryRepository
{
    public async Task<IReadOnlyList<CategoryListItemDto>> GetListAsync(CancellationToken cancellationToken) =>
        await db.Categories.AsNoTracking()
            .OrderBy(category => category.Name)
            .ThenBy(category => category.Code)
            .Select(category => new CategoryListItemDto(
                category.Id,
                category.Name,
                category.Code,
                db.Products.Count(product => product.CategoryId == category.Id)))
            .ToListAsync(cancellationToken);

    public async Task<CategoryDetailDto?> GetDetailAsync(int categoryId, CancellationToken cancellationToken)
    {
        var category = await db.Categories.AsNoTracking().FirstOrDefaultAsync(item => item.Id == categoryId, cancellationToken);
        if (category is null)
        {
            return null;
        }

        var products = await db.Products.AsNoTracking()
            .Where(product => product.CategoryId == categoryId)
            .OrderBy(product => product.Name)
            .Select(product => new LookupDto(product.Id, product.Name))
            .ToListAsync(cancellationToken);
        return new CategoryDetailDto(category.Id, category.Name, category.Code, products);
    }

    public Task<Category?> FindAsync(int categoryId, CancellationToken cancellationToken) =>
        db.Categories.FirstOrDefaultAsync(category => category.Id == categoryId, cancellationToken);

    public Task<bool> CodeExistsAsync(string code, int? excludedId, CancellationToken cancellationToken) =>
        db.Categories.AnyAsync(category => category.Code == code && (excludedId == null || category.Id != excludedId), cancellationToken);

    public async Task<IReadOnlyList<LookupDto>> GetAssignableProductsAsync(int? categoryId, CancellationToken cancellationToken) =>
        await db.Products.AsNoTracking()
            .Where(ProductCatalog.ListedOrLocal)
            .Where(product => product.CategoryId == null || product.CategoryId == 0 || (categoryId != null && product.CategoryId == categoryId))
            .OrderBy(product => product.Name)
            .Select(product => new LookupDto(product.Id, product.Name))
            .ToListAsync(cancellationToken);

    public async Task SetProductsAsync(int categoryId, IReadOnlyCollection<int> productIds, CancellationToken cancellationToken)
    {
        var products = await db.Products
            .Where(product => product.CategoryId == categoryId || productIds.Contains(product.Id))
            .ToListAsync(cancellationToken);
        foreach (var product in products)
        {
            product.AssignCategory(productIds.Contains(product.Id) ? categoryId : null);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddAsync(Category category, CancellationToken cancellationToken) => await db.Categories.AddAsync(category, cancellationToken);

    public void Remove(Category category) => db.Categories.Remove(category);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
