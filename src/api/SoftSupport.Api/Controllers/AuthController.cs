using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Auth;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

[AllowAnonymous]
[Route("api/softsupport/auth")]
public sealed class AuthController(IAuthService service) : SoftSupportControllerBase
{
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<LoginResponse>.Ok(await service.LoginAsync(request, cancellationToken), "Connexion réussie."));
}
