using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(product => product.Id);
        builder.Property(product => product.Id).HasColumnName("ProductId").UseIdentityColumn();
        builder.Property(product => product.Name).HasColumnName("ProductName").IsRequired();
        builder.Property(product => product.CrmId).HasColumnName("CRMId");
        builder.Property(product => product.Order).HasColumnName("Order");
        builder.Property(product => product.IsChecked).HasColumnName("isChecked");
        builder.Property(product => product.CompanyId).HasColumnName("companyId");
        builder.Property(product => product.CrmCode).HasColumnName("Code_CrmProduct");
        builder.Property(product => product.ParentId).HasColumnName("ParentP_Id");
        builder.Property(product => product.CategoryId).HasColumnName("CategorieId");
    }
}

public sealed class ThemeConfiguration : IEntityTypeConfiguration<Theme>
{
    public void Configure(EntityTypeBuilder<Theme> builder)
    {
        builder.ToTable("Themes");
        builder.HasKey(theme => theme.Id);
        builder.Property(theme => theme.Id).HasColumnName("ThemeId").UseIdentityColumn();
        builder.Property(theme => theme.Name).HasColumnName("ThemeName").IsRequired();
        builder.Property(theme => theme.Order).HasColumnName("Order");
        builder.Property(theme => theme.IsChecked).HasColumnName("isChecked");
        builder.Property(theme => theme.CrmId).HasColumnName("CRMId");
        builder.Property(theme => theme.CrmCode).HasColumnName("Code_CrmTheme").IsRequired();
    }
}

public sealed class SoftwareVersionConfiguration : IEntityTypeConfiguration<SoftwareVersion>
{
    public void Configure(EntityTypeBuilder<SoftwareVersion> builder)
    {
        builder.ToTable("Versions");
        builder.HasKey(version => version.Id);
        builder.Property(version => version.Id).HasColumnName("VersionId").UseIdentityColumn();
        builder.Property(version => version.Name).HasColumnName("VersionName").IsRequired();
        builder.Property(version => version.Order).HasColumnName("Order");
        builder.Property(version => version.IsChecked).HasColumnName("isChecked");
        builder.Property(version => version.CrmId).HasColumnName("CRMId");
        builder.Property(version => version.CrmCode).HasColumnName("Code_CrmVersion").IsRequired();
    }
}

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(category => category.Id);
        builder.Property(category => category.Id).HasColumnName("CategorieId").UseIdentityColumn();
        builder.Property(category => category.Name).HasColumnName("CategorieName").IsRequired();
        builder.Property(category => category.Code).HasColumnName("CategorieCode").IsRequired();
    }
}

public sealed class ProductPackConfiguration : IEntityTypeConfiguration<ProductPack>
{
    public void Configure(EntityTypeBuilder<ProductPack> builder)
    {
        builder.ToTable("ProductsPack");
        builder.HasKey(pack => new { pack.ProductId, pack.IncludedProductId });
        builder.Property(pack => pack.ProductId).HasColumnName("ProductId");
        builder.Property(pack => pack.IncludedProductId).HasColumnName("ProductIncluded");
        builder.HasOne<Product>().WithMany().HasForeignKey(pack => pack.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Product>().WithMany().HasForeignKey(pack => pack.IncludedProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
