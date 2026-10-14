using Microsoft.AspNetCore.Mvc;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

/// <summary>Compte de l'utilisateur connecté.</summary>
[Route("api/softsupport/account")]
public sealed class AccountController(IAccountService service) : SoftSupportControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetMe(CancellationToken cancellationToken) =>
        Ok(ApiResponse<UserProfileDto>.Ok(await service.GetMyProfileAsync(cancellationToken)));

    [HttpPut("password")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.ChangePasswordAsync(request, cancellationToken)));
}
