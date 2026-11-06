using SoftSupport.Application.DTOs.Dashboard;

namespace SoftSupport.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<ArticleDashboardDto> GetArticlesAsync(CancellationToken cancellationToken);

    Task<CustomerDashboardDto> GetCustomersAsync(CancellationToken cancellationToken);
}