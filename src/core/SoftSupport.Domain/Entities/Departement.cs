using SoftSupport.Domain.Common;

namespace SoftSupport.Domain.Entities;

public sealed class Departement : BaseEntity
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;

    public static Departement Create (string name, DateTime now)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new SoftSupportDomainException("Le nom est obligatoire.");
        }

        var departement = new Departement {
            Name = name.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        return departement;
    }

    public void Update (string name, DateTime now)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new SoftSupportDomainException("Le nom est obligatoire.");
        }

        Name = name;
        UpdatedAt = now;
    }

    public void Delete (DateTime now)
    {
        IsDeleted = true;
        UpdatedAt = now;
    }
}