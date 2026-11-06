using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.Interfaces.Services;

public interface IAccountService
{
    Task<UserProfileDto> GetMyProfileAsync(CancellationToken cancellationToken);

    Task<string> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken);
}