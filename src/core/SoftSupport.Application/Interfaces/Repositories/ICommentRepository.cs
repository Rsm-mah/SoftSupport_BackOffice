using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Comments;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface ICommentRepository
{
    Task<IReadOnlyList<CommentReply>> GetRepliesAsync(CancellationToken cancellationToken);

    Task<PagedResult<CommentRow>> SearchAsync(
        CommentsQuery query,
        IReadOnlyCollection<int> answeredIds,
        CancellationToken cancellationToken);

    Task<int> CountExceptAsync(IReadOnlyCollection<int> excludedIds, CancellationToken cancellationToken);

    Task<CommentRow?> GetRowAsync(int commentId, CancellationToken cancellationToken);

    Task<Comment?> FindAsync(int commentId, CancellationToken cancellationToken);

    void AddReply(CommentReply reply);

    void Remove(Comment comment);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}