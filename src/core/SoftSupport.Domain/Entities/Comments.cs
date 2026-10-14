using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Entities;

public sealed class Comment
{
    public int Id { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public int ArticleId { get; private set; }
    public int CustomerId { get; private set; }
}

// Réponse journalisée dans la table `Mails` de BDC : l'objet porte le numéro du commentaire.
public sealed class CommentReply
{
    public int Id { get; private set; }

    public string From { get; private set; } = string.Empty;

    public string To { get; private set; } = string.Empty;

    public string Subject { get; private set; } = string.Empty;

    public string Body { get; private set; } = string.Empty;

    public int? CommentId => CommentReplies.CommentIdOf(Subject);

    public static CommentReply Create(int commentId, string from, string to, string message)
    {
        if (string.IsNullOrWhiteSpace(to))
        {
            throw new SoftSupportDomainException("Le client n'a pas d'adresse e-mail : impossible de lui répondre.");
        }

        return new CommentReply
        {
            From = from.Trim(),
            To = to.Trim(),
            Subject = CommentReplies.SubjectFor(commentId),
            Body = CommentReplies.EnsureValidMessage(message),
        };
    }
}
