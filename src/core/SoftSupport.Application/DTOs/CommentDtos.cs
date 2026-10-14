using SoftSupport.Application.Common;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.DTOs.Comments;

public sealed class CommentsQuery : PagedQuery
{
    public CommentStatus? Status { get; init; }

    public string? Search { get; init; }
}

public sealed record CommentReplyDto(int Id, string From, string Message);

public sealed record CommentListItemDto(
    int Id,
    string Description,
    DateTime CreatedAt,
    int ArticleId,
    string? ArticleCode,
    string ArticleTitle,
    string CustomerName,
    string CustomerEmail,
    string? CompanyName,
    CommentStatus Status,
    IReadOnlyList<CommentReplyDto> Replies);

public sealed record CommentCountDto(int Pending);

public sealed record ReplyToCommentRequest(string Message);

public sealed record CommentRow(
    int Id,
    string Description,
    DateTime CreatedAt,
    int ArticleId,
    string? ArticleCode,
    string ArticleTitle,
    string CustomerFirstName,
    string CustomerLastName,
    string CustomerEmail,
    string? CompanyName);
