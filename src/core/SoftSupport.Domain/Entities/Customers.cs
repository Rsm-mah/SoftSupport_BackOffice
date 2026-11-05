using SoftSupport.Domain.Common;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Entities;

public sealed class Customer : BaseEntity
{
    public int Id { get; private set; }
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    // En clair : le portail client le compare tel quel.
    public string Password { get; private set; } = string.Empty;
    public int CompanyId { get; private set; }
    public bool IsAdmin { get; private set; }
    public string? Function { get; private set; }
    public string? Token { get; private set; }

    public static Customer Create(int companyId, string firstName, string lastName, string email, string? function, 
        bool isAdmin, string password, DateTime now)
    {
        CustomerRules.EnsureValidIdentity(firstName, lastName, email);

        var customer = new Customer { 
            CompanyId = companyId, 
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Email = email.Trim(),
            Password = password,
            Function = string.IsNullOrWhiteSpace(function) ? null : function.Trim(),
            IsAdmin = isAdmin, 
            Token = string.Empty,
            CreatedAt = now,
            UpdatedAt = now
        };

        return customer;
    }

    public void Update(string firstName, string lastName, string email, string? function, bool isAdmin, DateTime now)
    {
        CustomerRules.EnsureValidIdentity(firstName, lastName, email);

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Email = email.Trim();
        Function = CustomerRules.NormalizeFunction(function);
        IsAdmin = isAdmin;
        UpdatedAt = now;
    }

    public void Delete (DateTime now)
    {
        IsDeleted = true;
        UpdatedAt = now;
    }

    public void ResetPassword(string password) => Password = password;
}