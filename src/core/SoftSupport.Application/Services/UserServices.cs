using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Services;

public sealed class AccountService(
    IUserRepository users,
    ICurrentUser currentUser,
    IPasswordHasher passwordHasher,
    ILogger<AccountService> logger) : IAccountService
{
    public async Task<UserProfileDto> GetMyProfileAsync(CancellationToken cancellationToken) =>
        await users.GetProfileAsync(currentUser.UserId, cancellationToken)
        ?? throw new KeyNotFoundException("Utilisateur introuvable.");

    public async Task<string> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await users.FindAsync(currentUser.UserId, cancellationToken)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (!passwordHasher.Verify(request.CurrentPassword, user.Password))
        {
            throw new SoftSupportDomainException("Le mot de passe actuel est incorrect.");
        }

        user.ChangePassword(passwordHasher.Hash(request.NewPassword));
        await users.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Mot de passe modifié par le titulaire du compte {UserId}", user.Id);
        return "Votre mot de passe a été modifié.";
    }
}

public sealed class UserAdminService(
    IUserRepository users,
    IReferentielRepository referentiels,
    ICurrentUser currentUser,
    IPasswordHasher passwordHasher,
    IOptions<SoftSupportOptions> options,
    TimeProvider clock,
    ILogger<UserAdminService> logger) : IUserAdminService
{
    public Task<IReadOnlyList<UserListItemDto>> GetAllAsync(CancellationToken cancellationToken) =>
        users.GetAllAsync(cancellationToken);

    public async Task<UserFormOptionsDto> GetFormOptionsAsync(CancellationToken cancellationToken) =>
        new(await referentiels.GetRolesAsync(cancellationToken), await referentiels.GetDepartementsAsync(cancellationToken));

    public async Task<string> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        if (await users.EmailExistsAsync(email, null, cancellationToken))
        {
            throw new SoftSupportConflictException("Un utilisateur utilise déjà cette adresse e-mail.");
        }

        await EnsureReferencesAsync(request.RoleId, request.DepartementId, request.ValidatorDepartementIds, cancellationToken);

        var defaultPassword = options.Value.DefaultPassword;
        var user = User.Create(
            request.FirstName,
            request.LastName,
            email,
            passwordHasher.Hash(defaultPassword),
            request.DepartementId,
            request.RoleId,
            clock.GetLocalNow().DateTime);
        user.UpdateAccess(
            request.FirstName,
            request.LastName,
            request.RoleId,
            request.DepartementId,
            request.ValidatorDepartementIds ?? []);

        await users.AddAsync(user, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Compte {UserId} créé", user.Id);
        return $"Utilisateur créé. Mot de passe initial : {defaultPassword}";
    }

    public async Task<string> UpdateAsync(string userId, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var user = await users.FindAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");
        await EnsureReferencesAsync(request.RoleId, request.DepartementId, request.ValidatorDepartementIds, cancellationToken);

        user.UpdateAccess(
            request.FirstName,
            request.LastName,
            request.RoleId,
            request.DepartementId,
            request.ValidatorDepartementIds ?? []);
        await users.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Compte {UserId} modifié", userId);
        return "Utilisateur modifié avec succès.";
    }

    public async Task<string> DeleteAsync(string userId, CancellationToken cancellationToken)
    {
        if (userId == currentUser.UserId)
        {
            throw new SoftSupportDomainException("Vous ne pouvez pas supprimer votre propre compte.");
        }

        var user = await users.FindAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        // Les articles sont supprimés en cascade avec leur auteur : on refuse plutôt que de les perdre.
        if (await users.HasArticlesAsync(userId, cancellationToken))
        {
            throw new SoftSupportConflictException(
                "Vous ne pouvez pas supprimer cet utilisateur car celui-ci possède des articles.");
        }

        users.Remove(user);
        await users.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Compte {UserId} supprimé", userId);
        return "Utilisateur supprimé.";
    }

    private async Task EnsureReferencesAsync(
        int roleId,
        int departementId,
        IReadOnlyList<int>? validatorDepartementIds,
        CancellationToken cancellationToken)
    {
        if (!await referentiels.RoleExistsAsync(roleId, cancellationToken))
        {
            throw new SoftSupportDomainException("Le rôle choisi est introuvable.");
        }

        if (!await referentiels.DepartementExistsAsync(departementId, cancellationToken))
        {
            throw new SoftSupportDomainException("Le département choisi est introuvable.");
        }

        foreach (var id in validatorDepartementIds ?? [])
        {
            if (!await referentiels.DepartementExistsAsync(id, cancellationToken))
            {
                throw new SoftSupportDomainException("Un département à valider est introuvable.");
            }
        }
    }
}
