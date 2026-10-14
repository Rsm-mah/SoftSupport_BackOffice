using System.Globalization;

namespace SoftSupport.Domain.Rules;

public enum CommentStatus
{
    Pending = 0,

    Answered = 1,
}

public static class CommentReplies
{
    // Format partagé avec le portail client (SoftSupport_FrontOffice) : ne pas le modifier d'un seul côté.
    public const string SubjectPrefix = "Réponse à votre commentaire n°";

    public const int MaxMessageLength = 4000;

    public static string SubjectFor(int commentId) =>
        SubjectPrefix + commentId.ToString(CultureInfo.InvariantCulture);

    public static int? CommentIdOf(string? subject) =>
        subject is not null
        && subject.StartsWith(SubjectPrefix, StringComparison.Ordinal)
        && int.TryParse(subject.AsSpan(SubjectPrefix.Length), NumberStyles.None, CultureInfo.InvariantCulture, out var id)
            ? id
            : null;

    public static CommentStatus StatusOf(int replyCount) =>
        replyCount > 0 ? CommentStatus.Answered : CommentStatus.Pending;

    public static string EnsureValidMessage(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new SoftSupportDomainException("La réponse est obligatoire.");
        }

        var text = message.Trim();
        if (text.Length > MaxMessageLength)
        {
            throw new SoftSupportDomainException($"La réponse ne doit pas dépasser {MaxMessageLength} caractères.");
        }

        return text;
    }
}
