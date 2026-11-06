using SoftSupport.Application.Common;

namespace SoftSupport.Application.DTOs.Users;

public sealed record LookupDto(int Id, string Name);

public sealed class UsersQuery : PagedQuery
{
    public int? RoleId { get; init; }

    public string? Search { get; init; }
}

public sealed record UserListItemDto(
    string UserId,
    string? FirstName,
    string? LastName,
    string Email,
    DateTime DateCreated,
    int RoleId,
    string? Role,
    int DepartementId,
    string? Departement,
    IReadOnlyList<int> ValidatorDepartementIds);

public sealed record UserProfileDto(
    string UserId,
    string? FirstName,
    string? LastName,
    string Email,
    DateTime DateCreated,
    string? Role,
    string? Departement,
    IReadOnlyList<string> ValidatorDepartements);

public sealed record UserFormOptionsDto(IReadOnlyList<LookupDto> Roles, IReadOnlyList<LookupDto> Departements);

public sealed record CreateUserRequest(
    string? FirstName,
    string? LastName,
    string Email,
    int RoleId,
    int DepartementId,
    IReadOnlyList<int>? ValidatorDepartementIds);

public sealed record UpdateUserRequest(
    string? FirstName,
    string? LastName,
    int RoleId,
    int DepartementId,
    IReadOnlyList<int>? ValidatorDepartementIds);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
