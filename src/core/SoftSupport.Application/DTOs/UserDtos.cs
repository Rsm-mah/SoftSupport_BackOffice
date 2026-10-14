namespace SoftSupport.Application.DTOs.Users;

/// <summary>Élément de liste déroulante : identifiant et libellé.</summary>
public sealed record LookupDto(int Id, string Name);

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

/// <summary>Création d'un compte : le mot de passe initial est celui de la configuration.</summary>
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

/// <summary>Changement de mot de passe par le titulaire du compte.</summary>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
