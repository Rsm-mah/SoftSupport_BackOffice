using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Comments;

namespace SoftSupport.Application.Interfaces.Services;

public interface ICommentService
{
    Task<PagedResult<CommentListItemDto>> SearchAsync(CommentsQuery query, CancellationToken cancellationToken);

    Task<CommentCountDto> CountPendingAsync(CancellationToken cancellationToken);

    Task<string> ReplyAsync(int commentId, ReplyToCommentRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int commentId, CancellationToken cancellationToken);
}