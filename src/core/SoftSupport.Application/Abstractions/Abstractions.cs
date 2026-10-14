namespace SoftSupport.Application.Abstractions;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }

    string UserId { get; }

    string? RoleName { get; }
}

// Les comptes BDC ont des mots de passe en clair : ils restent acceptés tant que Security:HashPasswords est faux.
public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string? stored);

    bool NeedsUpgrade(string? stored);
}

public sealed record AccessTokenClaims(
    string UserId,
    string Email,
    string? FirstName,
    string? LastName,
    string? RoleName,
    string? DepartementName,
    bool IsValidator);

public interface IAccessTokenFactory
{
    string Create(AccessTokenClaims claims);
}

public sealed record EmailMessage(IReadOnlyList<string> To, string Subject, string HtmlBody)
{
    public EmailMessage(string to, string subject, string htmlBody)
        : this([to], subject, htmlBody)
    {
    }
}

public interface IEmailQueue
{
    void Enqueue(EmailMessage message);
}
