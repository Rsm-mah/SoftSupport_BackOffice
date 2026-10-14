using Microsoft.Extensions.Logging;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Auth;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Application.Services;

public sealed class AuthService(
    IUserRepository users,
    IPasswordHasher passwordHasher,
    IAccessTokenFactory tokenFactory,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailWithAccessAsync(request.Email.Trim(), cancellationToken);
        if (user is null || !passwordHasher.Verify(request.Password, user.Password))
        {
            logger.LogWarning("Connexion refusée pour {Email}", request.Email);
            throw new SoftSupportAuthenticationException("Adresse e-mail ou mot de passe incorrect.");
        }

        if (passwordHasher.NeedsUpgrade(user.Password))
        {
            user.ChangePassword(passwordHasher.Hash(request.Password));
            await users.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Mot de passe du compte {UserId} haché à la connexion", user.Id);
        }

        var authUser = new AuthUserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.Role?.Name,
            user.Departement?.Name,
            user.IsValidator);

        var token = tokenFactory.Create(new AccessTokenClaims(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role?.Name,
            user.Departement?.Name,
            user.IsValidator));

        logger.LogInformation("Connexion réussie pour {UserId}", user.Id);
        return new LoginResponse(token, authUser);
    }
}
