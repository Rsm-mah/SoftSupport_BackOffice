using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Comments;
using SoftSupport.Application.Interfaces;
using SoftSupport.Application.Mail;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

public sealed class CommentService(
    ICommentRepository comments,
    IUserRepository users,
    ICurrentUser currentUser,
    IEmailQueue emailQueue,
    IOptions<SoftSupportOptions> options,
    ILogger<CommentService> logger) : ICommentService
{
    public async Task<PagedResult<CommentListItemDto>> SearchAsync(CommentsQuery query, CancellationToken cancellationToken)
    {
        var replies = await LoadRepliesAsync(cancellationToken);
        var page = await comments.SearchAsync(query, replies.Keys.ToList(), cancellationToken);

        return new PagedResult<CommentListItemDto>
        {
            Items = page.Items.Select(row => ToItem(row, replies)).ToList(),
            TotalCount = page.TotalCount,
            Page = page.Page,
            PageSize = page.PageSize,
        };
    }

    public async Task<CommentCountDto> CountPendingAsync(CancellationToken cancellationToken)
    {
        var replies = await LoadRepliesAsync(cancellationToken);
        return new CommentCountDto(await comments.CountExceptAsync(replies.Keys.ToList(), cancellationToken));
    }

    public async Task<string> ReplyAsync(int commentId, ReplyToCommentRequest request, CancellationToken cancellationToken)
    {
        var row = await comments.GetRowAsync(commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Commentaire introuvable.");
        var agent = await users.FindAsync(currentUser.UserId, cancellationToken)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        var reply = CommentReply.Create(commentId, agent.Email, row.CustomerEmail, request.Message);
        comments.AddReply(reply);
        await comments.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Réponse au commentaire {CommentId} envoyée par {UserId}", commentId, agent.Id);

        emailQueue.Enqueue(SoftSupportMailTemplates.CommentAnswered(
            reply.To,
            reply.Subject,
            row.CustomerFirstName,
            row.ArticleCode,
            row.ArticleTitle,
            row.Description,
            reply.Body,
            options.Value.CustomerPortalUrl));

        return $"La réponse a été envoyée par e-mail à {reply.To}.";
    }

    public async Task<string> DeleteAsync(int commentId, CancellationToken cancellationToken)
    {
        var comment = await comments.FindAsync(commentId, cancellationToken)
            ?? throw new KeyNotFoundException("Commentaire introuvable.");

        comments.Remove(comment);
        await comments.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Commentaire {CommentId} supprimé par {UserId}", commentId, currentUser.UserId);
        return "Le commentaire a été supprimé.";
    }

    private async Task<Dictionary<int, List<CommentReply>>> LoadRepliesAsync(CancellationToken cancellationToken) =>
        (await comments.GetRepliesAsync(cancellationToken))
            .Where(reply => reply.CommentId.HasValue)
            .GroupBy(reply => reply.CommentId!.Value)
            .ToDictionary(group => group.Key, group => group.OrderBy(reply => reply.Id).ToList());

    private static CommentListItemDto ToItem(CommentRow row, IReadOnlyDictionary<int, List<CommentReply>> replies)
    {
        var sent = replies.TryGetValue(row.Id, out var list) ? list : [];
        return new CommentListItemDto(
            row.Id,
            row.Description,
            row.CreatedAt,
            row.ArticleId,
            row.ArticleCode,
            row.ArticleTitle,
            $"{row.CustomerFirstName} {row.CustomerLastName}".Trim(),
            row.CustomerEmail,
            row.CompanyName,
            CommentReplies.StatusOf(sent.Count),
            sent.Select(reply => new CommentReplyDto(reply.Id, reply.From, reply.Body)).ToList());
    }
}
