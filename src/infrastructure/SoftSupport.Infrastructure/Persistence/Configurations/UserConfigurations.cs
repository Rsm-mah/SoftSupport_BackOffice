using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Id).HasColumnName("UserId").HasMaxLength(450).ValueGeneratedNever();
        builder.Property(user => user.FirstName).HasColumnName("FirstName");
        builder.Property(user => user.LastName).HasColumnName("LastName");
        builder.Property(user => user.Email).HasColumnName("Email").IsRequired();
        builder.Property(user => user.Password).HasColumnName("Password").IsRequired();
        builder.Property(user => user.DateCreated).HasColumnName("DateCreated");
        builder.Property(user => user.Validator).HasColumnName("Validator");
        builder.Property(user => user.DepartementId).HasColumnName("DepartementId");
        builder.Property(user => user.RoleId).HasColumnName("RoleId");
        builder.Ignore(user => user.IsValidator);
        builder.Ignore(user => user.DisplayName);

        builder.HasOne(user => user.Departement).WithMany().HasForeignKey(user => user.DepartementId);
        builder.HasOne(user => user.Role).WithMany().HasForeignKey(user => user.RoleId);
    }
}

public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(role => role.Id);
        builder.Property(role => role.Id).HasColumnName("RoleId").UseIdentityColumn();
        builder.Property(role => role.Name).HasColumnName("RoleName").IsRequired();
    }
}

public sealed class DepartementConfiguration : IEntityTypeConfiguration<Departement>
{
    public void Configure(EntityTypeBuilder<Departement> builder)
    {
        builder.ToTable("Departements");
        builder.HasKey(departement => departement.Id);
        builder.Property(departement => departement.Id).HasColumnName("DepartementId").UseIdentityColumn();
        builder.Property(departement => departement.Name).HasColumnName("DepartementName").IsRequired();
    }
}
