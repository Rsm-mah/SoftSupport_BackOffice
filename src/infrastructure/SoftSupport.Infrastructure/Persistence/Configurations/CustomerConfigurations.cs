using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Infrastructure.Persistence.Configurations;

public sealed class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");
        builder.HasKey(company => company.Id);
        builder.Property(company => company.Id).HasColumnName("CompanyId").UseIdentityColumn();
        builder.Property(company => company.Name).HasColumnName("CompanyName").IsRequired();
        builder.Property(company => company.ShortName).HasColumnName("CNomAbrege").IsRequired();
        builder.Property(company => company.UserNumber).HasColumnName("UserNumber");
    }
}

public sealed class ContractLineConfiguration : IEntityTypeConfiguration<ContractLine>
{
    public void Configure(EntityTypeBuilder<ContractLine> builder)
    {
        builder.ToTable("CompanyProducts");
        builder.HasKey(line => line.Id);
        builder.Property(line => line.Id).HasColumnName("CompanyProductId").UseIdentityColumn();
        builder.Property(line => line.StartDate).HasColumnName("StartDate");
        builder.Property(line => line.EndDate).HasColumnName("EndDate");
        builder.Property(line => line.CompanyId).HasColumnName("CompanyId");
        builder.Property(line => line.ProductId).HasColumnName("ProductId");
        builder.HasOne(line => line.Company).WithMany().HasForeignKey(line => line.CompanyId);
        builder.HasOne(line => line.Product).WithMany().HasForeignKey(line => line.ProductId);
    }
}

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");
        builder.HasKey(customer => customer.Id);
        builder.Property(customer => customer.Id).HasColumnName("CustomerId").UseIdentityColumn();
        builder.Property(customer => customer.FirstName).HasColumnName("FirstName").IsRequired();
        builder.Property(customer => customer.LastName).HasColumnName("LastName").IsRequired();
        builder.Property(customer => customer.Email).HasColumnName("Email").IsRequired();
        builder.Property(customer => customer.Password).HasColumnName("Password").IsRequired();
        builder.Property(customer => customer.CompanyId).HasColumnName("CompanyId");
        builder.Property(customer => customer.IsAdmin).HasColumnName("isAdmin");
        builder.Property(customer => customer.Function).HasColumnName("Function");
        builder.Property(customer => customer.Token).HasColumnName("token");
        builder.HasOne<Company>().WithMany().HasForeignKey(customer => customer.CompanyId);
    }
}

public sealed class ContractHistoryConfiguration : IEntityTypeConfiguration<ContractHistory>
{
    public void Configure(EntityTypeBuilder<ContractHistory> builder)
    {
        builder.ToTable("CHistoriques");
        builder.HasKey(history => history.Id);
        builder.Property(history => history.Id).HasColumnName("HistoriqueId").UseIdentityColumn();
        builder.Property(history => history.Type).HasColumnName("Type").HasConversion<int>();
        builder.Property(history => history.CompanyName).HasColumnName("CompanyName").IsRequired();
        builder.Property(history => history.UserNumber).HasColumnName("UserNumber");
        builder.Property(history => history.StartDate).HasColumnName("DebutContrat");
        builder.Property(history => history.EndDate).HasColumnName("FinContrat");
        builder.Property(history => history.CreatedAt).HasColumnName("DateCreated");
        builder.Property(history => history.ProductId).HasColumnName("ProductId");
    }
}
