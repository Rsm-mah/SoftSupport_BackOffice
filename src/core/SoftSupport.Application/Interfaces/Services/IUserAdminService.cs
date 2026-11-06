using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.Interfaces.Services;

public interface IUserAdminService
{
    Task<PagedResult<UserListItemDto>> GetAllAsync(UsersQuery query, CancellationToken cancellationToken);

    Task<UserFormOptionsDto> GetFormOptionsAsync(CancellationToken cancellationToken);

    Task<string> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(string userId, UpdateUserRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(string userId, CancellationToken cancellationToken);
}