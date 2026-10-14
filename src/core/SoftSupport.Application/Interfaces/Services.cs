using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.DTOs.Auth;
using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Comments;
using SoftSupport.Application.DTOs.Customers;
using SoftSupport.Application.DTOs.Dashboard;
using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
}

public interface IAccountService
{
    Task<UserProfileDto> GetMyProfileAsync(CancellationToken cancellationToken);

    Task<string> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken);
}

public interface IUserAdminService
{
    Task<IReadOnlyList<UserListItemDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<UserFormOptionsDto> GetFormOptionsAsync(CancellationToken cancellationToken);

    Task<string> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(string userId, UpdateUserRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(string userId, CancellationToken cancellationToken);
}

public interface IArticleQueryService
{
    Task<PagedResult<ArticleListItemDto>> SearchAsync(ArticlesQuery query, CancellationToken cancellationToken);

    Task<ArticleStatsDto> GetStatsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleListItemDto>> GetRecentAsync(CancellationToken cancellationToken);

    Task<ArticleDetailDto> OpenAsync(int articleId, CancellationToken cancellationToken);

    Task<ArticleReferencesDto> GetReferencesAsync(CancellationToken cancellationToken);
}

public interface IArticleAuthoringService
{
    Task<IReadOnlyList<MyArticleDto>> GetMineAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<RefusedArticleDto>> GetMyRefusedAsync(CancellationToken cancellationToken);

    Task<EditableArticleDto> GetEditableAsync(int articleId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveArticleRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int articleId, SaveArticleRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int articleId, CancellationToken cancellationToken);

    Task<string> ChangeOptionsAsync(int articleId, ArticleOptionsRequest request, CancellationToken cancellationToken);

    Task<string> SendBackToValidationAsync(int articleId, CancellationToken cancellationToken);

    Task<ExportFile> ExportAsync(ArticleExportQuery query, CancellationToken cancellationToken);
}

public interface IArticleValidationService
{
    Task<PendingCountDto> CountPendingAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<PendingArticleDto>> GetPendingAsync(CancellationToken cancellationToken);

    Task<EditableArticleDto> GetForValidationAsync(int articleId, CancellationToken cancellationToken);

    Task<string> ValidateAsync(int articleId, ValidateArticleRequest request, CancellationToken cancellationToken);

    Task<string> DenyAsync(int articleId, ArticleCommentRequest request, CancellationToken cancellationToken);

    Task<string> RemoveAsync(int articleId, ArticleCommentRequest request, CancellationToken cancellationToken);

    Task<string> ImportFromCrmAsync(CancellationToken cancellationToken);
}

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

public interface IThemeService
{
    Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int themeId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int themeId, SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int themeId, CancellationToken cancellationToken);
}

public interface IVersionService
{
    Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int versionId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int versionId, SaveNameRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int versionId, CancellationToken cancellationToken);

    Task<string> ImportFromCrmAsync(CancellationToken cancellationToken);
}

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CategoryDetailDto> GetDetailAsync(int categoryId, CancellationToken cancellationToken);

    Task<IReadOnlyList<LookupDto>> GetAssignableProductsAsync(int? categoryId, CancellationToken cancellationToken);

    Task<string> CreateAsync(SaveCategoryRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int categoryId, SaveCategoryRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int categoryId, CancellationToken cancellationToken);
}

public interface ICompanyService
{
    Task<IReadOnlyList<CompanyListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CompanyDetailDto> GetDetailAsync(int companyId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> GetCrmCompanyNamesAsync(CancellationToken cancellationToken);

    Task<ApiResponse<CompanySavedDto>> CreateAsync(CreateCompanyRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int companyId, UpdateCompanyRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int companyId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ContractLineDto>> GetProductContractsAsync(int companyId, int productId, CancellationToken cancellationToken);

    Task<string> AddContractAsync(int companyId, SaveContractRequest request, CancellationToken cancellationToken);

    Task<string> UpdateContractAsync(int contractId, SaveContractRequest request, CancellationToken cancellationToken);

    Task<string> RenewContractAsync(int companyId, SaveContractRequest request, CancellationToken cancellationToken);

    Task<string> DeleteContractAsync(int contractId, CancellationToken cancellationToken);

    Task<ApiResponse<CustomerSavedDto>> AddCustomerAsync(int companyId, SaveCustomerRequest request, CancellationToken cancellationToken);

    Task<ApiResponse<CustomerSavedDto>> UpdateCustomerAsync(int customerId, SaveCustomerRequest request, CancellationToken cancellationToken);

    Task<string> DeleteCustomerAsync(int customerId, CancellationToken cancellationToken);

    Task<PagedResult<ContractHistoryItemDto>> SearchHistoryAsync(ContractHistoryQuery query, CancellationToken cancellationToken);
}

public interface IContractAlertService
{
    Task<int> SendDueAlertsAsync(CancellationToken cancellationToken);
}

public interface IDashboardService
{
    Task<ArticleDashboardDto> GetArticlesAsync(CancellationToken cancellationToken);

    Task<CustomerDashboardDto> GetCustomersAsync(CancellationToken cancellationToken);
}

public interface ICommentService
{
    Task<PagedResult<CommentListItemDto>> SearchAsync(CommentsQuery query, CancellationToken cancellationToken);

    Task<CommentCountDto> CountPendingAsync(CancellationToken cancellationToken);

    Task<string> ReplyAsync(int commentId, ReplyToCommentRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int commentId, CancellationToken cancellationToken);
}
