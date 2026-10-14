using Microsoft.EntityFrameworkCore;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Infrastructure.Crm;

public sealed class CrmDbContext(DbContextOptions<CrmDbContext> options) : DbContext(options)
{
    public DbSet<CrmCase> Cases => Set<CrmCase>();
    public DbSet<CrmCaption> Captions => Set<CrmCaption>();
    public DbSet<CrmUser> Users => Set<CrmUser>();
    public DbSet<CrmCompany> Companies => Set<CrmCompany>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CrmCase>(builder =>
        {
            builder.ToTable("Cases");
            builder.HasKey(item => item.Id);
            builder.Property(item => item.Id).HasColumnName("Case_CaseId").ValueGeneratedNever();
            builder.Property(item => item.ArticleTitle).HasColumnName("case_desartbdc");
            builder.Property(item => item.Description).HasColumnName("case_Description");
            builder.Property(item => item.IsKnowledgeBase).HasColumnName("case_bdc");
            builder.Property(item => item.KnowledgeBaseProposal).HasColumnName("case_bdcpoposition");
            builder.Property(item => item.KnowledgeBaseRefused).HasColumnName("case_bdcrefuse");
            builder.Property(item => item.ProblemNote).HasColumnName("Case_ProblemNote");
            builder.Property(item => item.SolutionNote).HasColumnName("Case_SolutionNote");
            builder.Property(item => item.ProductCode).HasColumnName("case_prod1");
            builder.Property(item => item.AssignedUserId).HasColumnName("Case_AssignedUserId");
            builder.Property(item => item.CreatedDate).HasColumnName("Case_CreatedDate");
            builder.Property(item => item.VersionCode).HasColumnName("case_version");
            builder.Ignore(item => item.Title);
        });

        modelBuilder.Entity<CrmCaption>(builder =>
        {
            builder.ToTable("Custom_Captions");
            builder.HasKey(item => item.Id);
            builder.Property(item => item.Id).HasColumnName("Capt_CaptionId").ValueGeneratedNever();
            builder.Property(item => item.Family).HasColumnName("Capt_Family");
            builder.Property(item => item.Code).HasColumnName("Capt_Code");
            builder.Property(item => item.Label).HasColumnName("Capt_FR");
            builder.Property(item => item.Order).HasColumnName("Capt_Order");
        });

        modelBuilder.Entity<CrmUser>(builder =>
        {
            builder.ToTable("users");
            builder.HasKey(item => item.Id);
            builder.Property(item => item.Id).HasColumnName("User_UserId").ValueGeneratedNever();
            builder.Property(item => item.LastName).HasColumnName("User_LastName");
            builder.Property(item => item.FirstName).HasColumnName("User_FirstName");
            builder.Property(item => item.Email).HasColumnName("User_EmailAddress");
        });

        modelBuilder.Entity<CrmCompany>(builder =>
        {
            builder.ToTable("Company");
            builder.HasKey(item => item.Id);
            builder.Property(item => item.Id).HasColumnName("Comp_CompanyId").ValueGeneratedNever();
            builder.Property(item => item.Name).HasColumnName("Comp_Name");
            builder.Property(item => item.Type).HasColumnName("Comp_Type");
        });
    }
}
