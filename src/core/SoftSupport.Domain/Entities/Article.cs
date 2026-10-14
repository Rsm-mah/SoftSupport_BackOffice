using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Entities;

/// <summary>Contenu modifiable d'un article : saisi par le rédacteur ou ajusté par le validateur.</summary>
public sealed record ArticleContent(
    string Title,
    string Problem,
    string Solution,
    string Designation,
    int? ProductId,
    int? VersionId,
    int? ThemeId,
    string? TicketNumber,
    string? RequestNumber);

/// <summary>Article de la base de connaissances (table <c>Articles</c>).</summary>
public sealed class Article
{
    public int Id { get; private set; }

    /// <summary>Numéro du cas CRM d'origine pour un article importé.</summary>
    public int? TicketId { get; private set; }

    public string Reference { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Designation { get; private set; } = string.Empty;
    public string Problem { get; private set; } = string.Empty;
    public string Solution { get; private set; } = string.Empty;

    /// <summary>Motif du dernier refus, communiqué au rédacteur.</summary>
    public string? Comment { get; private set; }

    public int ViewNumber { get; private set; }
    public bool InCrm { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsAffected { get; private set; }
    public bool IsValidated { get; private set; }

    /// <summary>Faux pour un article refusé : il quitte la base et revient à son rédacteur.</summary>
    public bool IsEnabled { get; private set; }

    public string? UserId { get; private set; }
    public int? CrmAssignedUser { get; private set; }

    /// <summary>Diffusion : « 1 » interne, « 1,2 » interne et clients (voir <see cref="ArticleOptions"/>).</summary>
    public string? Options { get; private set; }

    public int? ProductId { get; private set; }
    public int? ThemeId { get; private set; }
    public int? VersionId { get; private set; }
    public int? CategoryId { get; private set; }
    public string? Code { get; private set; }
    public string? TicketNumber { get; private set; }
    public string? RequestNumber { get; private set; }
    public User? Author { get; private set; }

    public static Article Create(string code, ArticleContent content, string authorId, DateTime now)
    {
        var article = new Article
        {
            Code = code,
            UserId = authorId,
            InCrm = false,
            IsEnabled = true,
            CreatedAt = now,
        };
        article.Apply(content);
        return article;
    }

    /// <summary>Article créé à partir d'un cas CRM marqué « base de connaissances ».</summary>
    public static Article ImportFromCrm(
        string code,
        int caseId,
        string title,
        string? problem,
        string? solution,
        string? authorId,
        int? crmAssignedUser,
        int? productId,
        int? versionId,
        DateTime now) =>
        new()
        {
            Code = code,
            TicketId = caseId,
            Title = title.Trim(),
            Problem = problem ?? string.Empty,
            Solution = solution ?? string.Empty,
            UserId = authorId,
            CrmAssignedUser = crmAssignedUser,
            ProductId = productId,
            VersionId = versionId,
            InCrm = true,
            IsEnabled = true,
            CreatedAt = now,
        };

    /// <summary>Modification par le rédacteur : un article refusé repart en validation.</summary>
    public void UpdateByAuthor(ArticleContent content)
    {
        Apply(content);
        IsEnabled = true;
    }

    /// <summary>Le validateur publie l'article, éventuellement corrigé, avec sa diffusion.</summary>
    public void Validate(ArticleContent? correctedContent, string? options)
    {
        if (!IsEnabled)
        {
            throw new SoftSupportDomainException("Cet article a été refusé : il doit d'abord être corrigé par son rédacteur.");
        }

        if (correctedContent is not null)
        {
            Apply(correctedContent);
        }

        IsValidated = true;
        IsEnabled = true;
        Options = ArticleOptions.Normalize(options);
    }

    public void Deny(string comment)
    {
        if (string.IsNullOrWhiteSpace(comment))
        {
            throw new SoftSupportDomainException("Le commentaire de refus est obligatoire.");
        }

        Comment = comment.Trim();
        IsEnabled = false;
    }

    public void ChangeOptions(string? options) => Options = ArticleOptions.Normalize(options);

    /// <summary>Retire la publication : l'article retourne dans la file de validation.</summary>
    public void SendBackToValidation()
    {
        IsValidated = false;
        Options = null;
    }

    public void RegisterView() => ViewNumber++;

    /// <summary>Vrai si le contenu proposé diffère du contenu enregistré.</summary>
    public bool DiffersFrom(ArticleContent content) =>
        Title != content.Title
        || Problem != content.Problem
        || Solution != content.Solution
        || ProductId != content.ProductId
        || VersionId != content.VersionId
        || ThemeId != content.ThemeId
        || TicketNumber != content.TicketNumber
        || RequestNumber != content.RequestNumber;

    private void Apply(ArticleContent content)
    {
        if (string.IsNullOrWhiteSpace(content.Title))
        {
            throw new SoftSupportDomainException("Le titre de l'article est obligatoire.");
        }

        Title = content.Title.Trim();
        Problem = content.Problem;
        Solution = content.Solution;
        Designation = content.Designation;
        ProductId = content.ProductId;
        VersionId = content.VersionId;
        ThemeId = content.ThemeId;
        TicketNumber = content.TicketNumber;
        RequestNumber = content.RequestNumber;
    }
}

/// <summary>
/// Vote d'un utilisateur client sur un article (table <c>ArticleVotes</c>), saisi depuis le
/// portail client : vrai = utile, faux = pas utile. Le back-office ne fait que le lire.
/// </summary>
public sealed class ArticleVote
{
    public int Id { get; private set; }
    public bool IsLike { get; private set; }
    public int ArticleId { get; private set; }
    public int CustomerId { get; private set; }
}

/// <summary>Date de modification d'un article (table <c>ArticleUpdateLogs</c>).</summary>
public sealed class ArticleUpdateLog
{
    public int Id { get; private set; }
    public DateTime UpdateDate { get; private set; }
    public int ArticleId { get; private set; }

    public static ArticleUpdateLog For(Article article, DateTime now) =>
        new() { ArticleId = article.Id, UpdateDate = now };

    public static ArticleUpdateLog For(int articleId, DateTime now) =>
        new() { ArticleId = articleId, UpdateDate = now };
}
