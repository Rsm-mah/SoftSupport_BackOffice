namespace SoftSupport.Domain.Entities;

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

    public string Title => string.IsNullOrWhiteSpace(ArticleTitle) ? Description ?? string.Empty : ArticleTitle;

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

public sealed class CrmCaption
{
    public int Id { get; private set; }
    public string? Family { get; private set; }
    public string? Code { get; private set; }
    public string? Label { get; private set; }
    public int? Order { get; private set; }
}

public sealed class CrmUser
{
    public int Id { get; private set; }
    public string? LastName { get; private set; }
    public string? FirstName { get; private set; }
    public string? Email { get; private set; }
}

public sealed class CrmCompany
{
    public int Id { get; private set; }
    public string? Name { get; private set; }
    public string? Type { get; private set; }
}
