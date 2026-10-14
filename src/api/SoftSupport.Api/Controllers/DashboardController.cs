using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Api.Security;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Dashboard;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

/// <summary>
/// Tableau de bord : chaque bloc a sa propre politique d'accès, une page n'affiche que les blocs
/// autorisés pour le rôle de l'utilisateur.
/// </summary>
[Route("api/softsupport/dashboard")]
public sealed class DashboardController(IDashboardService service) : SoftSupportControllerBase
{
    /// <summary>Articles les plus lus et les plus mal notés par les clients : Administrateur.</summary>
    [HttpGet("articles")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
    [ProducesResponseType(typeof(ApiResponse<ArticleDashboardDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ArticleDashboardDto>>> GetArticles(CancellationToken cancellationToken) =>
        Ok(ApiResponse<ArticleDashboardDto>.Ok(await service.GetArticlesAsync(cancellationToken)));

    /// <summary>Contrats qui expirent ce mois-ci et comptes clients par société : Commercial et Responsable Commercial.</summary>
    [HttpGet("customers")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Commercial)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDashboardDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CustomerDashboardDto>>> GetCustomers(CancellationToken cancellationToken) =>
        Ok(ApiResponse<CustomerDashboardDto>.Ok(await service.GetCustomersAsync(cancellationToken)));
}
