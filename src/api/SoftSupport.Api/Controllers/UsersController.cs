using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Api.Security;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

[Route("api/softsupport/users")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
public sealed class UsersController(IUserAdminService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UserListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserListItemDto>>>> GetAll(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<UserListItemDto>>.Ok(await service.GetAllAsync(cancellationToken)));

    /// <summary>Rôles et départements proposés dans le formulaire (et l'extraction des articles).</summary>
    [HttpGet("form-options")]
    [ProducesResponseType(typeof(ApiResponse<UserFormOptionsDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserFormOptionsDto>>> GetFormOptions(CancellationToken cancellationToken) =>
        Ok(ApiResponse<UserFormOptionsDto>.Ok(await service.GetFormOptionsAsync(cancellationToken)));

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.CreateAsync(request, cancellationToken)));

    // `{id?}` : quelques comptes BDC historiques ont un identifiant vide.
    [HttpPut("{id?}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(string? id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.UpdateAsync(id ?? string.Empty, request, cancellationToken)));

    [HttpDelete("{id?}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(string? id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteAsync(id ?? string.Empty, cancellationToken)));
}
