namespace SoftSupport.Domain.Entities;

/// <summary>Produit du catalogue (table <c>Products</c>), importé du CRM ou créé localement.</summary>
public sealed class Product
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int? CrmId { get; private set; }
    public int? Order { get; private set; }
    public bool IsChecked { get; private set; }
    public int CompanyId { get; private set; }

    /// <summary>Code de la liste « case_prod1 » du CRM.</summary>
    public int? CrmCode { get; private set; }

    public int ParentId { get; private set; }
    public int? CategoryId { get; private set; }

    public static Product Create(string name, int? categoryId) =>
        new() { Name = RequireName(name), IsChecked = true, CategoryId = categoryId };

    public static Product ImportFromCrm(string name, int crmId, int? order, int? crmCode) =>
        new() { Name = RequireName(name), CrmId = crmId, Order = order, CrmCode = crmCode, IsChecked = true };

    public void Update(string name, int? categoryId)
    {
        Name = RequireName(name);
        CategoryId = categoryId;
    }

    public void AssignCategory(int? categoryId) => CategoryId = categoryId;

    /// <summary>Aligne le produit sur la légende CRM ; <paramref name="present"/> vaut faux s'il a disparu du CRM.</summary>
    public void SyncWithCrm(bool present, string? name = null, int? order = null)
    {
        IsChecked = present;
        if (present && !string.IsNullOrWhiteSpace(name))
        {
            Name = name.Trim();
            Order = order;
        }
    }

    private static string RequireName(string name) =>
        string.IsNullOrWhiteSpace(name)
            ? throw new SoftSupportDomainException("Le nom du produit est obligatoire.")
            : name.Trim();
}

/// <summary>Thème d'article (table <c>Themes</c>).</summary>
public sealed class Theme
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int? Order { get; private set; }
    public bool IsChecked { get; private set; }
    public int? CrmId { get; private set; }
    public string CrmCode { get; private set; } = string.Empty;

    public static Theme Create(string name) => new() { Name = RequireName(name), IsChecked = true };

    public void Rename(string name) => Name = RequireName(name);

    private static string RequireName(string name) =>
        string.IsNullOrWhiteSpace(name)
            ? throw new SoftSupportDomainException("Le nom du thème est obligatoire.")
            : name.Trim();
}

/// <summary>Version logicielle (table <c>Versions</c>), alignée sur la liste « case_version » du CRM.</summary>
public sealed class SoftwareVersion
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int? Order { get; private set; }
    public bool IsChecked { get; private set; }
    public int? CrmId { get; private set; }
    public string CrmCode { get; private set; } = string.Empty;

    public static SoftwareVersion Create(string name) => new() { Name = RequireName(name), IsChecked = true };

    public static SoftwareVersion ImportFromCrm(string name, int crmId, int? order, string? crmCode) =>
        new() { Name = RequireName(name), CrmId = crmId, Order = order, CrmCode = crmCode ?? string.Empty, IsChecked = true };

    public void Rename(string name) => Name = RequireName(name);

    public void SyncWithCrm(bool present, string? name = null, int? order = null)
    {
        IsChecked = present;
        if (present && !string.IsNullOrWhiteSpace(name))
        {
            Name = name.Trim();
            Order = order;
        }
    }

    private static string RequireName(string name) =>
        string.IsNullOrWhiteSpace(name)
            ? throw new SoftSupportDomainException("Le nom de la version est obligatoire.")
            : name.Trim();
}

/// <summary>Catégorie de produits (table <c>Categories</c>) : son code préfixe les identifiants d'articles.</summary>
public sealed class Category
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;

    public static Category Create(string name, string code) => new() { Name = RequireName(name), Code = NormalizeCode(code) };

    public void Update(string name, string code)
    {
        Name = RequireName(name);
        Code = NormalizeCode(code);
    }

    public static string NormalizeCode(string code) =>
        string.IsNullOrWhiteSpace(code)
            ? throw new SoftSupportDomainException("Le code de la catégorie est obligatoire.")
            : code.Trim().ToUpperInvariant();

    private static string RequireName(string name) =>
        string.IsNullOrWhiteSpace(name)
            ? throw new SoftSupportDomainException("Le nom de la catégorie est obligatoire.")
            : name.Trim();
}

/// <summary>Produit inclus dans un pack (table <c>ProductsPack</c>).</summary>
public sealed class ProductPack
{
    public int ProductId { get; private set; }
    public int IncludedProductId { get; private set; }

    public static ProductPack Create(int productId, int includedProductId)
    {
        if (productId == includedProductId)
        {
            throw new SoftSupportDomainException("Un pack ne peut pas s'inclure lui-même.");
        }

        return new ProductPack { ProductId = productId, IncludedProductId = includedProductId };
    }
}
