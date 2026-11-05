using SoftSupport.Domain.Common;

namespace SoftSupport.Domain.Entities;

public sealed class Role : BaseEntity
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;

    public static Role Create (string name, DateTime now)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new SoftSupportDomainException("Le nom est obligatoire.");
        }

        var role = new Role {
            Name = name.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        return role;
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