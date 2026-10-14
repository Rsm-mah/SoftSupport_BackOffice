using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Api.Security;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Dashboard;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

[Route("api/softsupport/dashboard")]
public sealed class DashboardController(IDashboardService service) : SoftSupportControllerBase
{
    [HttpGet("articles")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
    [ProducesResponseType(typeof(ApiResponse<ArticleDashboardDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ArticleDashboardDto>>> GetArticles(CancellationToken cancellationToken) =>
        Ok(ApiResponse<ArticleDashboardDto>.Ok(await service.GetArticlesAsync(cancellationToken)));

    [HttpGet("customers")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Commercial)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDashboardDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CustomerDashboardDto>>> GetCustomers(CancellationToken cancellationToken) =>
        Ok(ApiResponse<CustomerDashboardDto>.Ok(await service.GetCustomersAsync(cancellationToken)));
}
