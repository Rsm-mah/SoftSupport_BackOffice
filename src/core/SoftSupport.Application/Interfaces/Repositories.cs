using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Customers;
using SoftSupport.Application.DTOs.Dashboard;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces;

public interface IUserRepository
{
    /// <summary>Compte chargé avec son rôle et son département (connexion).</summary>
    Task<User?> FindByEmailWithAccessAsync(string email, CancellationToken cancellationToken);

    Task<User?> FindAsync(string userId, CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(string email, string? excludedUserId, CancellationToken cancellationToken);

    Task<UserProfileDto?> GetProfileAsync(string userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<UserListItemDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<bool> HasArticlesAsync(string userId, CancellationToken cancellationToken);

    Task AddAsync(User user, CancellationToken cancellationToken);

    void Remove(User user);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IReferentielRepository
{
    Task<IReadOnlyList<LookupDto>> GetRolesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<LookupDto>> GetDepartementsAsync(CancellationToken cancellationToken);

    Task<bool> RoleExistsAsync(int roleId, CancellationToken cancellationToken);

    Task<bool> DepartementExistsAsync(int departementId, CancellationToken cancellationToken);
}

/// <summary>Écritures sur les articles.</summary>
public interface IArticleRepository
{
    Task<Article?> FindAsync(int articleId, CancellationToken cancellationToken);

    /// <summary>Plus grand identifiant d'article commençant par le préfixe (ex. <c>SAGCPT|</c>).</summary>
    Task<string?> GetLastCodeAsync(string prefix, CancellationToken cancellationToken);

    Task<string?> GetCategoryCodeOfProductAsync(int? productId, CancellationToken cancellationToken);

    /// <summary>Noms du produit et de la version, pour composer la désignation.</summary>
    Task<(string? ProductName, string? VersionName)> GetDesignationPartsAsync(
        int? productId,
        int? versionId,
        CancellationToken cancellationToken);

    /// <summary>Codes CRM du produit et de la version, reportés sur le cas d'origine.</summary>
    Task<(string? ProductCode, string? VersionCode)> GetCrmCodesAsync(
        int? productId,
        int? versionId,
        CancellationToken cancellationToken);

    Task<HashSet<int>> GetImportedCaseIdsAsync(CancellationToken cancellationToken);

    /// <summary>Correspondances nécessaires à l'import CRM : code produit → produit, nom de version → version, e-mail → compte.</summary>
    Task<CrmImportLookups> GetCrmImportLookupsAsync(CancellationToken cancellationToken);

    Task<string?> GetAuthorEmailAsync(string? userId, CancellationToken cancellationToken);

    Task AddAsync(Article article, CancellationToken cancellationToken);

    void AddUpdateLog(ArticleUpdateLog log);

    void Remove(Article article);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed record CrmImportLookups(
    IReadOnlyDictionary<string, (int ProductId, string? CategoryCode)> ProductsByCrmCode,
    IReadOnlyDictionary<string, int> VersionsByName,
    IReadOnlyDictionary<string, string> UserIdsByEmail);

/// <summary>Article chargé pour modification, avec ce qu'il faut pour contrôler les droits.</summary>
public sealed record EditableArticleRow(EditableArticleDto Article, string? AuthorId, int? AuthorDepartementId);

public sealed record ArticleExportRow(
    string? Code,
    string? TicketNumber,
    string? RequestNumber,
    string Designation,
    DateTime CreatedAt,
    bool IsValidated,
    string? Author);

/// <summary>Lectures des articles, projetées directement en DTO.</summary>
public interface IArticleReadRepository
{
    Task<PagedResult<ArticleListItemDto>> SearchAsync(ArticlesQuery query, CancellationToken cancellationToken);

    Task<ArticleStatsDto> GetStatsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleListItemDto>> GetRecentAsync(int take, CancellationToken cancellationToken);

    Task<(ArticleDetailDto Article, int? CrmAssignedUser)?> GetDetailAsync(int articleId, CancellationToken cancellationToken);

    Task<IReadOnlyList<MyArticleDto>> GetByAuthorAsync(string userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<RefusedArticleDto>> GetRefusedByAuthorAsync(string userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<PendingArticleDto>> GetPendingAsync(
        IReadOnlyCollection<int> departementIds,
        CancellationToken cancellationToken);

    Task<int> CountPendingAsync(IReadOnlyCollection<int> departementIds, CancellationToken cancellationToken);

    Task<EditableArticleRow?> GetEditableAsync(int articleId, CancellationToken cancellationToken);

    Task<ArticleReferencesDto> GetReferencesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleExportRow>> GetExportRowsAsync(
        DateTime from,
        DateTime toExclusive,
        int departementId,
        CancellationToken cancellationToken);
}

public interface IProductRepository
{
    Task<IReadOnlyList<ProductListItemDto>> GetListAsync(CancellationToken cancellationToken);

    /// <summary>Tous les produits par ordre alphabétique (contrats, packs).</summary>
    Task<IReadOnlyList<LookupDto>> GetLookupAsync(CancellationToken cancellationToken);

    Task<Product?> FindAsync(int productId, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken);

    Task<bool> CategoryExistsAsync(int categoryId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int productId, CancellationToken cancellationToken);

    Task<bool> HasContractsAsync(int productId, CancellationToken cancellationToken);

    Task<bool> IsInPackAsync(int productId, CancellationToken cancellationToken);

    Task<int> CountExistingAsync(IReadOnlyCollection<int> productIds, CancellationToken cancellationToken);

    /// <summary>Produits issus du CRM, suivis pour la synchronisation.</summary>
    Task<List<Product>> GetCrmProductsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<PackDto>> GetPacksAsync(CancellationToken cancellationToken);

    Task<List<ProductPack>> GetPackLinksAsync(int productId, CancellationToken cancellationToken);

    Task AddAsync(Product product, CancellationToken cancellationToken);

    void Remove(Product product);

    void AddPackLink(ProductPack link);

    void RemovePackLinks(IEnumerable<ProductPack> links);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

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

public interface IVersionRepository
{
    Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<SoftwareVersion?> FindAsync(int versionId, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int versionId, CancellationToken cancellationToken);

    Task<List<SoftwareVersion>> GetAllTrackedAsync(CancellationToken cancellationToken);

    Task AddAsync(SoftwareVersion version, CancellationToken cancellationToken);

    void Remove(SoftwareVersion version);

    void RemoveRange(IEnumerable<SoftwareVersion> versions);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ICategoryRepository
{
    Task<IReadOnlyList<CategoryListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CategoryDetailDto?> GetDetailAsync(int categoryId, CancellationToken cancellationToken);

    Task<Category?> FindAsync(int categoryId, CancellationToken cancellationToken);

    Task<bool> CodeExistsAsync(string code, int? excludedId, CancellationToken cancellationToken);

    /// <summary>Produits sans catégorie, plus ceux de la catégorie indiquée.</summary>
    Task<IReadOnlyList<LookupDto>> GetAssignableProductsAsync(int? categoryId, CancellationToken cancellationToken);

    /// <summary>Rattache exactement ces produits à la catégorie et détache les autres.</summary>
    Task SetProductsAsync(int categoryId, IReadOnlyCollection<int> productIds, CancellationToken cancellationToken);

    Task AddAsync(Category category, CancellationToken cancellationToken);

    void Remove(Category category);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ICompanyRepository
{
    Task<IReadOnlyList<CompanyListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CompanyDetailDto?> GetDetailAsync(int companyId, CancellationToken cancellationToken);

    Task<Company?> FindAsync(int companyId, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, CancellationToken cancellationToken);

    Task<List<ContractLine>> GetContractLinesAsync(int companyId, CancellationToken cancellationToken);

    Task<ContractLine?> FindContractLineAsync(int contractLineId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ContractLineDto>> GetProductContractsAsync(
        int companyId,
        int productId,
        CancellationToken cancellationToken);

    Task<List<Customer>> GetCustomersAsync(int companyId, CancellationToken cancellationToken);

    Task<Customer?> FindCustomerAsync(int customerId, CancellationToken cancellationToken);

    Task<bool> CustomerEmailExistsAsync(string email, int? excludedCustomerId, CancellationToken cancellationToken);

    Task<bool> ProductExistsAsync(int productId, CancellationToken cancellationToken);

    Task<PagedResult<ContractHistoryItemDto>> SearchHistoryAsync(
        ContractHistoryQuery query,
        CancellationToken cancellationToken);

    /// <summary>Lignes de contrat encore en cours, avec les e-mails des utilisateurs de la société.</summary>
    Task<IReadOnlyList<ExpiringContract>> GetRunningContractsAsync(DateTime today, CancellationToken cancellationToken);

    Task AddAsync(Company company, CancellationToken cancellationToken);

    void Remove(Company company);

    void AddContractLine(ContractLine line);

    void RemoveContractLine(ContractLine line);

    void AddCustomer(Customer customer);

    void RemoveCustomer(Customer customer);

    void AddHistory(ContractHistory history);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    /// <summary>Exécute un traitement en plusieurs enregistrements dans une seule transaction.</summary>
    Task<T> InTransactionAsync<T>(Func<Task<T>> work, CancellationToken cancellationToken);
}

public sealed record ExpiringContract(
    int ContractId,
    string CompanyName,
    string? ProductName,
    DateTime EndDate,
    IReadOnlyList<string> CustomerEmails);

/// <summary>Accès au CRM Softwell (base CRMSOFTWELL).</summary>
public interface ICrmGateway
{
    /// <summary>Cas proposés pour la base de connaissances, non refusés et rattachés à un produit.</summary>
    Task<IReadOnlyList<CrmCase>> GetKnowledgeBaseCasesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<int, string?>> GetUserEmailsAsync(CancellationToken cancellationToken);

    Task<string?> GetUserFirstNameAsync(int crmUserId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CrmCaption>> GetCaptionsAsync(string family, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> GetCustomerCompanyNamesAsync(CancellationToken cancellationToken);

    /// <summary>Reporte sur le cas d'origine les corrections d'un article validé ou modifié.</summary>
    Task UpdateCaseAsync(
        int caseId,
        string title,
        string problem,
        string solution,
        string? productCode,
        string? versionCode,
        CancellationToken cancellationToken);
}

/// <summary>Lectures agrégées du tableau de bord.</summary>
public interface IDashboardRepository
{
    /// <summary>Articles actifs et validés, avec leurs vues et les votes des clients.</summary>
    Task<IReadOnlyList<ArticleVoteStats>> GetArticleStatsAsync(CancellationToken cancellationToken);

    /// <summary>Lignes de contrat dont l'échéance tombe entre <paramref name="from"/> et <paramref name="to"/> inclus.</summary>
    Task<IReadOnlyList<ContractEndingRow>> GetContractsEndingAsync(DateTime from, DateTime to, CancellationToken cancellationToken);

    /// <summary>Sociétés clientes et nombre de comptes du portail de chacune.</summary>
    Task<IReadOnlyList<CompanyAccountsRow>> GetCompanyAccountsAsync(CancellationToken cancellationToken);
}
