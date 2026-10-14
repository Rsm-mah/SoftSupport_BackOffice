using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Comments;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;
using SoftSupport.Infrastructure.Persistence;

namespace SoftSupport.Infrastructure.Repositories;

public sealed class CommentRepository(SoftSupportDbContext db) : ICommentRepository
{
    public async Task<IReadOnlyList<CommentReply>> GetRepliesAsync(CancellationToken cancellationToken) =>
        await db.CommentReplies.AsNoTracking()
            .Where(reply => reply.Subject.StartsWith(CommentReplies.SubjectPrefix))
            .ToListAsync(cancellationToken);

    public async Task<PagedResult<CommentRow>> SearchAsync(
        CommentsQuery query,
        IReadOnlyCollection<int> answeredIds,
        CancellationToken cancellationToken)
    {
        var comments = db.Comments.AsNoTracking();
        comments = query.Status switch
        {
            CommentStatus.Pending => comments.Where(comment => !answeredIds.Contains(comment.Id)),
            CommentStatus.Answered => comments.Where(comment => answeredIds.Contains(comment.Id)),
            _ => comments,
        };

        // Le filtre porte sur les entités jointes : EF ne traduit pas un filtre sur le record projeté.
        var joined = Joined(comments);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            joined = joined.Where(row =>
                row.Comment.Description.Contains(search)
                || row.Article.Title.Contains(search)
                || (row.Article.Code != null && row.Article.Code.Contains(search))
                || row.Customer.FirstName.Contains(search)
                || row.Customer.LastName.Contains(search)
                || row.Customer.Email.Contains(search)
                || (row.CompanyName != null && row.CompanyName.Contains(search)));
        }

        var total = await joined.CountAsync(cancellationToken);
        var items = await joined
            .OrderByDescending(row => row.Comment.CreatedAt)
            .ThenByDescending(row => row.Comment.Id)
            .Skip(query.Skip)
            .Take(query.SafePageSize)
            .Select(ToRow)
            .ToListAsync(cancellationToken);

        return new PagedResult<CommentRow>
        {
            Items = items,
            TotalCount = total,
            Page = query.SafePage,
            PageSize = query.SafePageSize,
        };
    }

    public Task<int> CountExceptAsync(IReadOnlyCollection<int> excludedIds, CancellationToken cancellationToken) =>
        db.Comments.CountAsync(comment => !excludedIds.Contains(comment.Id), cancellationToken);

    public Task<CommentRow?> GetRowAsync(int commentId, CancellationToken cancellationToken) =>
        Joined(db.Comments.AsNoTracking().Where(comment => comment.Id == commentId))
            .Select(ToRow)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<Comment?> FindAsync(int commentId, CancellationToken cancellationToken) =>
        db.Comments.FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);

    public void AddReply(CommentReply reply) => db.CommentReplies.Add(reply);

    public void Remove(Comment comment) => db.Comments.Remove(comment);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);

    private IQueryable<JoinedComment> Joined(IQueryable<Comment> comments) =>
        from comment in comments
        join article in db.Articles on comment.ArticleId equals article.Id
        join customer in db.Customers on comment.CustomerId equals customer.Id
        select new JoinedComment
        {
            Comment = comment,
            Article = article,
            Customer = customer,
            CompanyName = db.Companies.Where(company => company.Id == customer.CompanyId).Select(company => company.Name).FirstOrDefault(),
        };

    private static readonly System.Linq.Expressions.Expression<Func<JoinedComment, CommentRow>> ToRow = row =>
        new CommentRow(
            row.Comment.Id,
            row.Comment.Description,
            row.Comment.CreatedAt,
            row.Article.Id,
            row.Article.Code,
            row.Article.Title,
            row.Customer.FirstName,
            row.Customer.LastName,
            row.Customer.Email,
            row.CompanyName);

    private sealed class JoinedComment
    {
        public required Comment Comment { get; init; }
        public required Article Article { get; init; }
        public required Customer Customer { get; init; }
        public string? CompanyName { get; init; }
    }
}
