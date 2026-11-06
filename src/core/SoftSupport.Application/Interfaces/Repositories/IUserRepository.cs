using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> FindByEmailWithAccessAsync(string email, CancellationToken cancellationToken);

    Task<User?> FindAsync(string userId, CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(string email, string? excludedUserId, CancellationToken cancellationToken);

    Task<UserProfileDto?> GetProfileAsync(string userId, CancellationToken cancellationToken);

    Task<PagedResult<UserListItemDto>> GetAllAsync(UsersQuery query, CancellationToken cancellationToken);

    Task<bool> HasArticlesAsync(string userId, CancellationToken cancellationToken);

    Task AddAsync(User user, CancellationToken cancellationToken);

    void Remove(User user);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}