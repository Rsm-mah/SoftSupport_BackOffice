using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SoftSupport.Application.Abstractions;

namespace SoftSupport.Infrastructure.Security;

public sealed class JwtAccessTokenFactory(IOptions<JwtOptions> options, TimeProvider clock) : IAccessTokenFactory
{
    public string Create(AccessTokenClaims claims)
    {
        var settings = options.Value;
        var now = clock.GetUtcNow();
        var tokenClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, claims.UserId),
            new(JwtRegisteredClaimNames.Email, claims.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(SoftSupportClaims.FirstName, claims.FirstName ?? string.Empty),
            new(SoftSupportClaims.LastName, claims.LastName ?? string.Empty),
            new(SoftSupportClaims.RoleName, claims.RoleName ?? string.Empty),
            new(SoftSupportClaims.DepartementName, claims.DepartementName ?? string.Empty),
            new(SoftSupportClaims.IsValidator, claims.IsValidator ? "true" : "false"),
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: settings.Issuer,
            audience: settings.Audience,
            claims: tokenClaims,
            notBefore: now.UtcDateTime,
            expires: now.AddMinutes(settings.ExpirationMinutes).UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
