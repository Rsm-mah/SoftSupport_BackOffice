using SoftSupport.Application.DTOs.Auth;

namespace SoftSupport.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
}