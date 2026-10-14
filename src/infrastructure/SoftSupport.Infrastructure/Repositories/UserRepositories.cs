using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;
using SoftSupport.Infrastructure.Persistence;

namespace SoftSupport.Infrastructure.Repositories;

public sealed class UserRepository(SoftSupportDbContext db) : IUserRepository
{
    public Task<User?> FindByEmailWithAccessAsync(string email, CancellationToken cancellationToken) =>
        db.Users
            .Include(user => user.Role)
            .Include(user => user.Departement)
            .FirstOrDefaultAsync(user => user.Email == email, cancellationToken);

    public Task<User?> FindAsync(string userId, CancellationToken cancellationToken) =>
        db.Users.FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public Task<bool> EmailExistsAsync(string email, string? excludedUserId, CancellationToken cancellationToken) =>
        db.Users.AnyAsync(
            user => user.Email == email && (excludedUserId == null || user.Id != excludedUserId),
            cancellationToken);

    public async Task<UserProfileDto?> GetProfileAsync(string userId, CancellationToken cancellationToken)
    {
        var row = await db.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.DateCreated,
                Role = user.Role!.Name,
                Departement = user.Departement!.Name,
                user.Validator,
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            return null;
        }

        var ids = ValidatorDepartements.Parse(row.Validator);
        var validated = ids.Count == 0
            ? []
            : await db.Departements.AsNoTracking()
                .Where(departement => ids.Contains(departement.Id))
                .OrderBy(departement => departement.Name)
                .Select(departement => departement.Name)
                .ToListAsync(cancellationToken);

        return new UserProfileDto(row.Id, row.FirstName, row.LastName, row.Email, row.DateCreated, row.Role, row.Departement, validated);
    }

    public async Task<IReadOnlyList<UserListItemDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var rows = await db.Users.AsNoTracking()
            .OrderBy(user => user.FirstName)
            .ThenBy(user => user.LastName)
            .Select(user => new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.DateCreated,
                user.RoleId,
                Role = user.Role!.Name,
                user.DepartementId,
                Departement = user.Departement!.Name,
                user.Validator,
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new UserListItemDto(
                row.Id,
                row.FirstName,
                row.LastName,
                row.Email,
                row.DateCreated,
                row.RoleId,
                row.Role,
                row.DepartementId,
                row.Departement,
                ValidatorDepartements.Parse(row.Validator)))
            .ToList();
    }

    public Task<bool> HasArticlesAsync(string userId, CancellationToken cancellationToken) =>
        db.Articles.AnyAsync(article => article.UserId == userId, cancellationToken);

    public async Task AddAsync(User user, CancellationToken cancellationToken) => await db.Users.AddAsync(user, cancellationToken);

    public void Remove(User user) => db.Users.Remove(user);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}

public sealed class ReferentielRepository(SoftSupportDbContext db) : IReferentielRepository
{
    public async Task<IReadOnlyList<LookupDto>> GetRolesAsync(CancellationToken cancellationToken) =>
        await db.Roles.AsNoTracking()
            .OrderBy(role => role.Id)
            .Select(role => new LookupDto(role.Id, role.Name))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<LookupDto>> GetDepartementsAsync(CancellationToken cancellationToken) =>
        await db.Departements.AsNoTracking()
            .OrderBy(departement => departement.Id)
            .Select(departement => new LookupDto(departement.Id, departement.Name))
            .ToListAsync(cancellationToken);

    public Task<bool> RoleExistsAsync(int roleId, CancellationToken cancellationToken) =>
        db.Roles.AnyAsync(role => role.Id == roleId, cancellationToken);

    public Task<bool> DepartementExistsAsync(int departementId, CancellationToken cancellationToken) =>
        db.Departements.AnyAsync(departement => departement.Id == departementId, cancellationToken);
}
