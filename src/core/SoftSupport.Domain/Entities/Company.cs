using SoftSupport.Domain.Common;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Entities;

public sealed class Company : BaseEntity
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string ShortName { get; private set; } = string.Empty;
    public int UserNumber { get; private set; }

    public static Company Create(string name, string shortName, int userNumber, DateTime now)
    {
        CompanyRules.EnsureValidName(name);
        CompanyRules.EnsureValidDetails(shortName, userNumber);

        var company = new Company { 
            Name = name.Trim(), 
            ShortName = shortName.Trim(), 
            UserNumber = userNumber, 
            CreatedAt = now, 
            UpdatedAt = now 
        };
        
        return company;
    }

    public void Update(string shortName, int userNumber)
    {
        if (userNumber < 0)
        {
            throw new SoftSupportDomainException("Le nombre d'utilisateurs ne peut pas être négatif.");
        }

        ShortName = shortName.Trim();
        UserNumber = userNumber;
    }

    public void Delete (DateTime now)
    {
        IsDeleted = true;
        UpdatedAt = now;
    }
}