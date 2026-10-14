using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Entities;

public sealed class User
{
    public string Id { get; private set; } = string.Empty;
    public string? FirstName { get; private set; }
    public string? LastName { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string Password { get; private set; } = string.Empty;
    public DateTime DateCreated { get; private set; }

    // Départements dont l'utilisateur valide les articles, au format BDC « 2,3, ».
    public string? Validator { get; private set; }

    public int DepartementId { get; private set; }
    public int RoleId { get; private set; }
    public Departement? Departement { get; private set; }
    public Role? Role { get; private set; }

    public bool IsValidator => ValidatorDepartements.Parse(Validator).Count > 0;

    public string DisplayName => $"{FirstName} {LastName}".Trim();

    public static User Create(
        string? firstName,
        string? lastName,
        string email,
        string password,
        int departementId,
        int roleId,
        DateTime now)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new SoftSupportDomainException("L'adresse e-mail est obligatoire.");
        }

        return new User
        {
            Id = Guid.NewGuid().ToString(),
            FirstName = firstName?.Trim(),
            LastName = lastName?.Trim(),
            Email = email.Trim(),
            Password = password,
            DateCreated = now,
            DepartementId = departementId,
            RoleId = roleId,
            Validator = string.Empty,
        };
    }

    public void UpdateAccess(
        string? firstName,
        string? lastName,
        int roleId,
        int departementId,
        IEnumerable<int> validatorDepartementIds)
    {
        FirstName = firstName?.Trim();
        LastName = lastName?.Trim();
        RoleId = roleId;
        DepartementId = departementId;
        Validator = ValidatorDepartements.Format(validatorDepartementIds);
    }

    public void ChangePassword(string password) => Password = password;
}

public sealed class Role
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
}

public sealed class Departement
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
}
