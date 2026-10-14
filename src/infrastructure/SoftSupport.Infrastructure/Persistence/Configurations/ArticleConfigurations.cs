using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Infrastructure.Persistence.Configurations;

public sealed class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.ToTable("Articles");
        builder.HasKey(article => article.Id);
        builder.Property(article => article.Id).HasColumnName("ArticleId").UseIdentityColumn();
        builder.Property(article => article.TicketId).HasColumnName("TicketId");
        builder.Property(article => article.Reference).HasColumnName("A_Ref").IsRequired();
        builder.Property(article => article.Title).HasColumnName("Title").IsRequired();
        builder.Property(article => article.Designation).HasColumnName("Designation").IsRequired();
        builder.Property(article => article.Problem).HasColumnName("Problem").IsRequired();
        builder.Property(article => article.Solution).HasColumnName("Solution").IsRequired();
        builder.Property(article => article.Comment).HasColumnName("Commentaire");
        builder.Property(article => article.ViewNumber).HasColumnName("ViewNumber");
        builder.Property(article => article.InCrm).HasColumnName("inCrm");
        builder.Property(article => article.CreatedAt).HasColumnName("CreatingDate");
        builder.Property(article => article.IsAffected).HasColumnName("isAffected");
        builder.Property(article => article.IsValidated).HasColumnName("isValidated");
        builder.Property(article => article.IsEnabled).HasColumnName("isEnabled");
        builder.Property(article => article.UserId).HasColumnName("UserId").HasMaxLength(450);
        builder.Property(article => article.CrmAssignedUser).HasColumnName("CrmAssignedUser");
        builder.Property(article => article.Options).HasColumnName("option");
        builder.Property(article => article.ProductId).HasColumnName("ProductId");
        builder.Property(article => article.ThemeId).HasColumnName("ThemeId");
        builder.Property(article => article.VersionId).HasColumnName("VersionId");
        builder.Property(article => article.CategoryId).HasColumnName("CategorieId");
        builder.Property(article => article.Code).HasColumnName("ArticleCode");
        builder.Property(article => article.TicketNumber).HasColumnName("NoTicket");
        builder.Property(article => article.RequestNumber).HasColumnName("NoDemande");

        builder.HasOne(article => article.Author).WithMany().HasForeignKey(article => article.UserId);
    }
}

public sealed class ArticleUpdateLogConfiguration : IEntityTypeConfiguration<ArticleUpdateLog>
{
    public void Configure(EntityTypeBuilder<ArticleUpdateLog> builder)
    {
        builder.ToTable("ArticleUpdateLogs");
        builder.HasKey(log => log.Id);
        builder.Property(log => log.Id).HasColumnName("ArticleLogId").UseIdentityColumn();
        builder.Property(log => log.UpdateDate).HasColumnName("UpdateDate");
        builder.Property(log => log.ArticleId).HasColumnName("ArticleId");

        builder.HasOne<Article>().WithMany().HasForeignKey(log => log.ArticleId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ArticleVoteConfiguration : IEntityTypeConfiguration<ArticleVote>
{
    public void Configure(EntityTypeBuilder<ArticleVote> builder)
    {
        builder.ToTable("ArticleVotes");
        builder.HasKey(vote => vote.Id);
        builder.Property(vote => vote.Id).HasColumnName("AVoteId").UseIdentityColumn();
        builder.Property(vote => vote.IsLike).HasColumnName("Vote");
        builder.Property(vote => vote.ArticleId).HasColumnName("ArticleId");
        builder.Property(vote => vote.CustomerId).HasColumnName("CustomerId");

        builder.HasOne<Article>().WithMany().HasForeignKey(vote => vote.ArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Customer>().WithMany().HasForeignKey(vote => vote.CustomerId).OnDelete(DeleteBehavior.Cascade);
    }
}
