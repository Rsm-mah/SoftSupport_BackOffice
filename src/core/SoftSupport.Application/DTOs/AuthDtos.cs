namespace SoftSupport.Application.DTOs.Auth;

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthUserDto(
    string UserId,
    string? FirstName,
    string? LastName,
    string Email,
    string? RoleName,
    string? DepartementName,
    bool IsValidator);

public sealed record LoginResponse(string Token, AuthUserDto User);
