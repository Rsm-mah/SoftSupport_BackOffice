using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SoftSupport.Application.Interfaces;
using SoftSupport.Application.Services;

namespace SoftSupport.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddSoftSupportApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly, includeInternalTypes: true);
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IUserAdminService, UserAdminService>();
        services.AddScoped<IArticleQueryService, ArticleQueryService>();
        services.AddScoped<IArticleAuthoringService, ArticleAuthoringService>();
        services.AddScoped<IArticleValidationService, ArticleValidationService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IThemeService, ThemeService>();
        services.AddScoped<IVersionService, VersionService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IContractAlertService, ContractAlertService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<ICommentService, CommentService>();
        return services;
    }
}
