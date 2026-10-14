using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Infrastructure.Persistence.Configurations;

public sealed class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("Comments");
        builder.HasKey(comment => comment.Id);
        builder.Property(comment => comment.Id).HasColumnName("CommentId").UseIdentityColumn();
        builder.Property(comment => comment.Description).HasColumnName("Description").IsRequired();
        builder.Property(comment => comment.CreatedAt).HasColumnName("DateComment");
        builder.Property(comment => comment.ArticleId).HasColumnName("ArticleId");
        builder.Property(comment => comment.CustomerId).HasColumnName("CustomerId");

        builder.HasOne<Article>().WithMany().HasForeignKey(comment => comment.ArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Customer>().WithMany().HasForeignKey(comment => comment.CustomerId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class CommentReplyConfiguration : IEntityTypeConfiguration<CommentReply>
{
    public void Configure(EntityTypeBuilder<CommentReply> builder)
    {
        builder.ToTable("Mails");
        builder.HasKey(reply => reply.Id);
        builder.Property(reply => reply.Id).HasColumnName("MailId").UseIdentityColumn();
        builder.Property(reply => reply.From).HasColumnName("From").IsRequired();
        builder.Property(reply => reply.To).HasColumnName("To").IsRequired();
        builder.Property(reply => reply.Subject).HasColumnName("Subject").IsRequired();
        builder.Property(reply => reply.Body).HasColumnName("Body").IsRequired();
        builder.Ignore(reply => reply.CommentId);
    }
}
