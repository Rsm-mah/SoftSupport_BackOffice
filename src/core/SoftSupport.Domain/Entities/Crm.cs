namespace SoftSupport.Domain.Entities;

/// <summary>Cas du CRM Softwell (table <c>Cases</c> de CRMSOFTWELL), source des articles importés.</summary>
public sealed class CrmCase
{
    public int Id { get; private set; }
    public string? ArticleTitle { get; private set; }
    public string? Description { get; private set; }
    public string? IsKnowledgeBase { get; private set; }
    public string? KnowledgeBaseProposal { get; private set; }
    public string? KnowledgeBaseRefused { get; private set; }
    public string? ProblemNote { get; private set; }
    public string? SolutionNote { get; private set; }
    public string? ProductCode { get; private set; }
    public int? AssignedUserId { get; private set; }
    public DateTime? CreatedDate { get; private set; }
    public string? VersionCode { get; private set; }

    /// <summary>Titre de l'article : le libellé dédié du cas, sinon sa description.</summary>
    public string Title => string.IsNullOrWhiteSpace(ArticleTitle) ? Description ?? string.Empty : ArticleTitle;

    /// <summary>Report sur le cas des corrections faites lors de la validation de l'article.</summary>
    public void ApplyArticle(string title, string problem, string solution, string? productCode, string? versionCode)
    {
        Description = title;
        ProblemNote = problem;
        SolutionNote = solution;
        if (!string.IsNullOrWhiteSpace(productCode))
        {
            ProductCode = productCode;
        }

        if (!string.IsNullOrWhiteSpace(versionCode))
        {
            VersionCode = versionCode;
        }
    }
}

/// <summary>Libellé d'une liste de valeurs du CRM (table <c>Custom_Captions</c>).</summary>
public sealed class CrmCaption
{
    public int Id { get; private set; }
    public string? Family { get; private set; }
    public string? Code { get; private set; }
    public string? Label { get; private set; }
    public int? Order { get; private set; }
}

/// <summary>Utilisateur du CRM (table <c>users</c>).</summary>
public sealed class CrmUser
{
    public int Id { get; private set; }
    public string? LastName { get; private set; }
    public string? FirstName { get; private set; }
    public string? Email { get; private set; }
}

/// <summary>Société du CRM (table <c>Company</c>).</summary>
public sealed class CrmCompany
{
    public int Id { get; private set; }
    public string? Name { get; private set; }
    public string? Type { get; private set; }
}
