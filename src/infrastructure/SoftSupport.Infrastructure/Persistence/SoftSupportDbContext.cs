using Microsoft.EntityFrameworkCore;
using SoftSupport.Domain.Entities;
using SoftSupport.Infrastructure.Persistence.Configurations;

namespace SoftSupport.Infrastructure.Persistence;

// Mappé sur la base BDC existante : aucune migration ne doit être générée depuis ce contexte.
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
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<CommentReply> CommentReplies => Set<CommentReply>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(SoftSupportDbContext).Assembly,
            type => type.Namespace == typeof(UserConfiguration).Namespace);
    }
}
