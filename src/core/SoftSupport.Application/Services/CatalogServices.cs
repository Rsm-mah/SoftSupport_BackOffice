using Microsoft.Extensions.Logging;
using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

public sealed class ProductService(
    IProductRepository products,
    ICrmGateway crm,
    ILogger<ProductService> logger) : IProductService
{
    public Task<IReadOnlyList<ProductListItemDto>> GetListAsync(CancellationToken cancellationToken) =>
        products.GetListAsync(cancellationToken);

    public Task<IReadOnlyList<LookupDto>> GetLookupAsync(CancellationToken cancellationToken) =>
        products.GetLookupAsync(cancellationToken);

    public async Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int productId, CancellationToken cancellationToken)
    {
        await RequireAsync(productId, cancellationToken);
        return await products.GetArticlesAsync(productId, cancellationToken);
    }

    public async Task<string> CreateAsync(SaveProductRequest request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        await EnsureValidAsync(name, request.CategoryId, null, cancellationToken);
        var product = Product.Create(name, request.CategoryId);
        await products.AddAsync(product, cancellationToken);
        await products.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Produit {ProductId} créé", product.Id);
        return $"Le produit « {product.Name} » a été créé.";
    }

    public async Task<string> UpdateAsync(int productId, SaveProductRequest request, CancellationToken cancellationToken)
    {
        var product = await RequireAsync(productId, cancellationToken);
        var name = request.Name.Trim();
        await EnsureValidAsync(name, request.CategoryId, productId, cancellationToken);
        product.Update(name, request.CategoryId);
        await products.SaveChangesAsync(cancellationToken);
        return $"Le produit « {product.Name} » a été modifié.";
    }

    public async Task<string> DeleteAsync(int productId, CancellationToken cancellationToken)
    {
        var product = await RequireAsync(productId, cancellationToken);
        // Les contrats clients sont supprimés en cascade avec le produit : on protège plutôt que de les perdre.
        if (await products.HasContractsAsync(productId, cancellationToken))
        {
            throw new SoftSupportConflictException(
                $"Impossible de supprimer « {product.Name} » : des contrats clients portent sur ce produit.");
        }

        if (await products.IsInPackAsync(productId, cancellationToken))
        {
            throw new SoftSupportConflictException(
                $"Impossible de supprimer « {product.Name} » : il appartient à un pack.");
        }

        products.Remove(product);
        await products.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Produit {ProductId} supprimé", productId);
        return $"Le produit « {product.Name} » a été supprimé.";
    }

    /// <summary>Aligne les produits sur la liste « case_prod1 » du CRM (création, libellés, ordre).</summary>
    public async Task<string> ImportFromCrmAsync(CancellationToken cancellationToken)
    {
        var captions = await crm.GetCaptionsAsync(ProductCatalog.CrmProductFamily, cancellationToken);
        var existing = await products.GetCrmProductsAsync(cancellationToken);
        var byCrmId = existing.Where(product => product.CrmId is not null).ToDictionary(product => product.CrmId!.Value);
        var seen = new HashSet<int>();
        int added = 0, updated = 0;

        foreach (var caption in captions.Where(caption => !string.IsNullOrWhiteSpace(caption.Label)))
        {
            seen.Add(caption.Id);
            if (byCrmId.TryGetValue(caption.Id, out var product))
            {
                product.SyncWithCrm(true, caption.Label, caption.Order);
                updated++;
            }
            else
            {
                await products.AddAsync(
                    Product.ImportFromCrm(caption.Label!, caption.Id, caption.Order, ParseCode(caption.Code)),
                    cancellationToken);
                added++;
            }
        }

        foreach (var product in existing.Where(product => product.CrmId is { } id && !seen.Contains(id)))
        {
            product.SyncWithCrm(false);
        }

        await products.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Import CRM des produits : {Added} ajouté(s), {Updated} mis à jour", added, updated);
        return $"Import terminé : {added} produit(s) ajouté(s), {updated} mis à jour.";
    }

    public Task<IReadOnlyList<PackDto>> GetPacksAsync(CancellationToken cancellationToken) =>
        products.GetPacksAsync(cancellationToken);

    public async Task<string> SavePackAsync(int productId, SavePackRequest request, CancellationToken cancellationToken)
    {
        var product = await RequireAsync(productId, cancellationToken);
        var included = request.IncludedProductIds.Where(id => id != productId).Distinct().ToList();
        if (included.Count == 0)
        {
            throw new SoftSupportDomainException("Sélectionner au moins un produit inclus dans le pack.");
        }

        if (await products.CountExistingAsync(included, cancellationToken) != included.Count)
        {
            throw new SoftSupportDomainException("Un des produits inclus est introuvable.");
        }

        var links = await products.GetPackLinksAsync(productId, cancellationToken);
        products.RemovePackLinks(links.Where(link => !included.Contains(link.IncludedProductId)).ToList());
        var existing = links.Select(link => link.IncludedProductId).ToHashSet();
        foreach (var id in included.Where(id => !existing.Contains(id)))
        {
            products.AddPackLink(ProductPack.Create(productId, id));
        }

        await products.SaveChangesAsync(cancellationToken);
        return $"Le pack « {product.Name} » a été enregistré.";
    }

    public async Task<string> DeletePackAsync(int productId, CancellationToken cancellationToken)
    {
        var links = await products.GetPackLinksAsync(productId, cancellationToken);
        if (links.Count == 0)
        {
            throw new KeyNotFoundException("Pack introuvable.");
        }

        products.RemovePackLinks(links);
        await products.SaveChangesAsync(cancellationToken);
        return "Le pack a été supprimé.";
    }

    private async Task EnsureValidAsync(string name, int? categoryId, int? excludedId, CancellationToken cancellationToken)
    {
        if (await products.NameExistsAsync(name, excludedId, cancellationToken))
        {
            throw new SoftSupportConflictException("Un produit porte déjà ce nom.");
        }

        if (categoryId is { } id && !await products.CategoryExistsAsync(id, cancellationToken))
        {
            throw new SoftSupportDomainException("La catégorie choisie est introuvable.");
        }
    }

    private async Task<Product> RequireAsync(int productId, CancellationToken cancellationToken) =>
        await products.FindAsync(productId, cancellationToken) ?? throw new KeyNotFoundException("Produit introuvable.");

    private static int? ParseCode(string? code) => int.TryParse(code, out var value) ? value : null;
}

public sealed class ThemeService(IThemeRepository themes, ILogger<ThemeService> logger) : IThemeService
{
    public Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken) => themes.GetListAsync(cancellationToken);

    public async Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int themeId, CancellationToken cancellationToken)
    {
        await RequireAsync(themeId, cancellationToken);
        return await themes.GetArticlesAsync(themeId, cancellationToken);
    }

    public async Task<string> CreateAsync(SaveNameRequest request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (await themes.NameExistsAsync(name, null, cancellationToken))
        {
            throw new SoftSupportConflictException("Ce thème existe déjà.");
        }

        var theme = Theme.Create(name);
        await themes.AddAsync(theme, cancellationToken);
        await themes.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Thème {ThemeId} créé", theme.Id);
        return $"Le thème « {theme.Name} » a été créé.";
    }

    public async Task<string> UpdateAsync(int themeId, SaveNameRequest request, CancellationToken cancellationToken)
    {
        var theme = await RequireAsync(themeId, cancellationToken);
        var name = request.Name.Trim();
        if (await themes.NameExistsAsync(name, themeId, cancellationToken))
        {
            throw new SoftSupportConflictException("Un autre thème porte déjà ce nom.");
        }

        theme.Rename(name);
        await themes.SaveChangesAsync(cancellationToken);
        return $"Le thème « {theme.Name} » a été modifié.";
    }

    public async Task<string> DeleteAsync(int themeId, CancellationToken cancellationToken)
    {
        var theme = await RequireAsync(themeId, cancellationToken);
        themes.Remove(theme);
        await themes.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Thème {ThemeId} supprimé", themeId);
        return $"Le thème « {theme.Name} » a été supprimé.";
    }

    private async Task<Theme> RequireAsync(int themeId, CancellationToken cancellationToken) =>
        await themes.FindAsync(themeId, cancellationToken) ?? throw new KeyNotFoundException("Thème introuvable.");
}

public sealed class VersionService(
    IVersionRepository versions,
    ICrmGateway crm,
    ILogger<VersionService> logger) : IVersionService
{
    public Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken) => versions.GetListAsync(cancellationToken);

    public async Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int versionId, CancellationToken cancellationToken)
    {
        await RequireAsync(versionId, cancellationToken);
        return await versions.GetArticlesAsync(versionId, cancellationToken);
    }

    public async Task<string> CreateAsync(SaveNameRequest request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (await versions.NameExistsAsync(name, null, cancellationToken))
        {
            throw new SoftSupportConflictException("Cette version existe déjà.");
        }

        var version = SoftwareVersion.Create(name);
        await versions.AddAsync(version, cancellationToken);
        await versions.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Version {VersionId} créée", version.Id);
        return $"La version « {version.Name} » a été créée.";
    }

    public async Task<string> UpdateAsync(int versionId, SaveNameRequest request, CancellationToken cancellationToken)
    {
        var version = await RequireAsync(versionId, cancellationToken);
        var name = request.Name.Trim();
        if (await versions.NameExistsAsync(name, versionId, cancellationToken))
        {
            throw new SoftSupportConflictException("Une autre version porte déjà ce nom.");
        }

        version.Rename(name);
        await versions.SaveChangesAsync(cancellationToken);
        return $"La version « {version.Name} » a été modifiée.";
    }

    public async Task<string> DeleteAsync(int versionId, CancellationToken cancellationToken)
    {
        var version = await RequireAsync(versionId, cancellationToken);
        versions.Remove(version);
        await versions.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Version {VersionId} supprimée", versionId);
        return $"La version « {version.Name} » a été supprimée.";
    }

    /// <summary>
    /// Aligne les versions sur la liste « case_version » du CRM. Comme dans BDC, les versions
    /// absentes du CRM sont retirées.
    /// </summary>
    public async Task<string> ImportFromCrmAsync(CancellationToken cancellationToken)
    {
        var captions = await crm.GetCaptionsAsync(ProductCatalog.CrmVersionFamily, cancellationToken);
        var existing = await versions.GetAllTrackedAsync(cancellationToken);
        var byCrmId = existing.Where(version => version.CrmId is not null).ToDictionary(version => version.CrmId!.Value);
        var seen = new HashSet<int>();
        int added = 0, updated = 0;

        foreach (var caption in captions.Where(caption => !string.IsNullOrWhiteSpace(caption.Label)))
        {
            seen.Add(caption.Id);
            if (byCrmId.TryGetValue(caption.Id, out var version))
            {
                version.SyncWithCrm(true, caption.Label, caption.Order);
                updated++;
            }
            else
            {
                await versions.AddAsync(
                    SoftwareVersion.ImportFromCrm(caption.Label!, caption.Id, caption.Order, caption.Code),
                    cancellationToken);
                added++;
            }
        }

        var removed = existing.Where(version => version.CrmId is not { } id || !seen.Contains(id)).ToList();
        versions.RemoveRange(removed);
        await versions.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Import CRM des versions : {Added} ajoutée(s), {Updated} mise(s) à jour, {Removed} retirée(s)",
            added,
            updated,
            removed.Count);
        return $"Import terminé : {added} version(s) ajoutée(s), {updated} mise(s) à jour, {removed.Count} retirée(s).";
    }

    private async Task<SoftwareVersion> RequireAsync(int versionId, CancellationToken cancellationToken) =>
        await versions.FindAsync(versionId, cancellationToken) ?? throw new KeyNotFoundException("Version introuvable.");
}

public sealed class CategoryService(ICategoryRepository categories, ILogger<CategoryService> logger) : ICategoryService
{
    public Task<IReadOnlyList<CategoryListItemDto>> GetListAsync(CancellationToken cancellationToken) =>
        categories.GetListAsync(cancellationToken);

    public async Task<CategoryDetailDto> GetDetailAsync(int categoryId, CancellationToken cancellationToken) =>
        await categories.GetDetailAsync(categoryId, cancellationToken) ?? throw new KeyNotFoundException("Catégorie introuvable.");

    public Task<IReadOnlyList<LookupDto>> GetAssignableProductsAsync(int? categoryId, CancellationToken cancellationToken) =>
        categories.GetAssignableProductsAsync(categoryId, cancellationToken);

    public async Task<string> CreateAsync(SaveCategoryRequest request, CancellationToken cancellationToken)
    {
        var code = Category.NormalizeCode(request.Code);
        if (await categories.CodeExistsAsync(code, null, cancellationToken))
        {
            throw new SoftSupportConflictException($"Le code « {code} » est déjà utilisé par une autre catégorie.");
        }

        var category = Category.Create(request.Name, code);
        await categories.AddAsync(category, cancellationToken);
        await categories.SaveChangesAsync(cancellationToken);
        await categories.SetProductsAsync(category.Id, request.ProductIds ?? [], cancellationToken);
        logger.LogInformation("Catégorie {CategoryId} créée ({Code})", category.Id, code);
        return $"La catégorie « {category.Code} » a été créée.";
    }

    public async Task<string> UpdateAsync(int categoryId, SaveCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await RequireAsync(categoryId, cancellationToken);
        var code = Category.NormalizeCode(request.Code);
        // La base contient déjà des codes en double : on ne contrôle que les codes modifiés.
        if (code != category.Code && await categories.CodeExistsAsync(code, categoryId, cancellationToken))
        {
            throw new SoftSupportConflictException($"Le code « {code} » est déjà utilisé par une autre catégorie.");
        }

        category.Update(request.Name, code);
        await categories.SaveChangesAsync(cancellationToken);
        await categories.SetProductsAsync(categoryId, request.ProductIds ?? [], cancellationToken);
        return $"La catégorie « {category.Code} » a été modifiée.";
    }

    /// <summary>Supprime la catégorie ; ses produits redeviennent sans catégorie.</summary>
    public async Task<string> DeleteAsync(int categoryId, CancellationToken cancellationToken)
    {
        var category = await RequireAsync(categoryId, cancellationToken);
        await categories.SetProductsAsync(categoryId, [], cancellationToken);
        categories.Remove(category);
        await categories.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Catégorie {CategoryId} supprimée", categoryId);
        return $"La catégorie « {category.Code} » a été supprimée.";
    }

    private async Task<Category> RequireAsync(int categoryId, CancellationToken cancellationToken) =>
        await categories.FindAsync(categoryId, cancellationToken) ?? throw new KeyNotFoundException("Catégorie introuvable.");
}
