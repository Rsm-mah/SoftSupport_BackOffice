using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SoftSupport.Application.Abstractions;
using SoftSupport.Infrastructure.Security;

namespace SoftSupport.Api.Security;

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public string UserId
    {
        get
        {
            // Certains comptes BDC historiques ont un identifiant vide : seule l'absence de claim est refusée.
            var value = Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return IsAuthenticated && value is not null
                ? value
                : throw new UnauthorizedAccessException("Utilisateur non authentifié.");
        }
    }

    public string? RoleName => Principal?.FindFirstValue(SoftSupportClaims.RoleName);
}
