using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Entities;

public sealed class Company
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;

    public string ShortName { get; private set; } = string.Empty;

    public int UserNumber { get; private set; }

    public static Company Create(string name, string shortName, int userNumber)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new SoftSupportDomainException("Le nom de la société est obligatoire.");
        }

        var company = new Company { Name = name.Trim() };
        company.Update(shortName, userNumber);
        return company;
    }

    public void Update(string shortName, int userNumber)
    {
        if (string.IsNullOrWhiteSpace(shortName))
        {
            throw new SoftSupportDomainException("Le nom abrégé est obligatoire.");
        }

        if (userNumber < 0)
        {
            throw new SoftSupportDomainException("Le nombre d'utilisateurs ne peut pas être négatif.");
        }

        ShortName = shortName.Trim();
        UserNumber = userNumber;
    }
}

public sealed class ContractLine
{
    public int Id { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public int CompanyId { get; private set; }
    public int ProductId { get; private set; }
    public Company? Company { get; private set; }
    public Product? Product { get; private set; }

    public static ContractLine Create(int companyId, int productId, DateTime startDate, DateTime endDate)
    {
        ContractRules.EnsureValidPeriod(startDate, endDate);
        return new ContractLine
        {
            CompanyId = companyId,
            ProductId = productId,
            StartDate = startDate.Date,
            EndDate = endDate.Date,
        };
    }

    public void Change(int productId, DateTime startDate, DateTime endDate)
    {
        ContractRules.EnsureValidPeriod(startDate, endDate);
        ProductId = productId;
        StartDate = startDate.Date;
        EndDate = endDate.Date;
    }
}

public sealed class Customer
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

    public static Customer Create(
        int companyId,
        string firstName,
        string lastName,
        string email,
        string? function,
        bool isAdmin,
        string password)
    {
        var customer = new Customer { CompanyId = companyId, Password = password, Token = string.Empty };
        customer.Update(firstName, lastName, email, function, isAdmin);
        return customer;
    }

    public void Update(string firstName, string lastName, string email, string? function, bool isAdmin)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new SoftSupportDomainException("L'adresse e-mail du client est obligatoire.");
        }

        FirstName = firstName?.Trim() ?? string.Empty;
        LastName = lastName?.Trim() ?? string.Empty;
        Email = email.Trim();
        Function = string.IsNullOrWhiteSpace(function) ? null : function.Trim();
        IsAdmin = isAdmin;
    }

    public void ResetPassword(string password) => Password = password;
}

public enum ContractHistoryType
{
    Creation = 0,
    Modification = 1,
    Suppression = 2,
    Renouvellement = 3,
}

public sealed class ContractHistory
{
    public int Id { get; private set; }
    public ContractHistoryType Type { get; private set; }
    public string CompanyName { get; private set; } = string.Empty;
    public int UserNumber { get; private set; }
    public DateTime StartDate { get; private set; }
    public int ProductId { get; private set; }
    public DateTime EndDate { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static ContractHistory Record(
        ContractHistoryType type,
        Company company,
        int productId,
        DateTime startDate,
        DateTime endDate,
        DateTime now) =>
        new()
        {
            Type = type,
            CompanyName = company.Name,
            UserNumber = company.UserNumber,
            ProductId = productId,
            StartDate = startDate,
            EndDate = endDate,
            CreatedAt = now,
        };

    public static ContractHistory Record(ContractHistoryType type, Company company, ContractLine line, DateTime now) =>
        Record(type, company, line.ProductId, line.StartDate, line.EndDate, now);
}
