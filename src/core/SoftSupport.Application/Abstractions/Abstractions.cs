namespace SoftSupport.Application.Abstractions;

/// <summary>Utilisateur authentifié de la requête courante (claims du jeton).</summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }

    /// <summary>Identifiant (GUID texte) ; lève <see cref="UnauthorizedAccessException"/> si absent.</summary>
    string UserId { get; }

    string? RoleName { get; }
}

/// <summary>
/// Vérification des mots de passe du back-office. Les comptes BDC existants ont un mot de passe
/// en clair : il reste accepté, et n'est haché (BCrypt) que si l'option de hachage est active.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>Valeur à enregistrer pour un nouveau mot de passe (hachée ou non selon la configuration).</summary>
    string Hash(string password);

    bool Verify(string password, string? stored);

    /// <summary>Vrai si la valeur stockée doit être réécrite après une connexion réussie.</summary>
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

/// <summary>Message électronique à envoyer en arrière-plan.</summary>
public sealed record EmailMessage(IReadOnlyList<string> To, string Subject, string HtmlBody)
{
    public EmailMessage(string to, string subject, string htmlBody)
        : this([to], subject, htmlBody)
    {
    }
}

/// <summary>
/// File d'envoi d'e-mails : l'appelant dépose le message et répond tout de suite,
/// l'envoi SMTP se fait hors de la requête HTTP.
/// </summary>
public interface IEmailQueue
{
    void Enqueue(EmailMessage message);
}
