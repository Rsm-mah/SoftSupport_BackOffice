using Microsoft.EntityFrameworkCore;
using SoftSupport.Domain.Entities;
using SoftSupport.Infrastructure.Persistence.Configurations;

namespace SoftSupport.Infrastructure.Persistence;

/// <summary>
/// Contexte EF Core de SoftSupport. Il se branche sur la base BDC existante sans la modifier :
/// chaque configuration reprend exactement les tables et colonnes en place. Aucune migration
/// n'est générée depuis ce contexte, et les tables Hangfire de l'ancienne application ne sont
/// pas touchées.
/// </summary>
public sealed class SoftSupportDbContext(DbContextOptions<SoftSupportDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Departement> Departements => Set<Departement>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<ArticleUpdateLog> ArticleUpdateLogs => Set<ArticleUpdateLog>();
    public DbSet<ArticleVote> ArticleVotes => Set<ArticleVote>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Theme> Themes => Set<Theme>();
    public DbSet<SoftwareVersion> Versions => Set<SoftwareVersion>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ProductPack> ProductPacks => Set<ProductPack>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<ContractLine> ContractLines => Set<ContractLine>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<ContractHistory> ContractHistories => Set<ContractHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(SoftSupportDbContext).Assembly,
            type => type.Namespace == typeof(UserConfiguration).Namespace);
    }
}
