using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface ICrmGateway
{
    Task<IReadOnlyList<CrmCase>> GetKnowledgeBaseCasesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<int, string?>> GetUserEmailsAsync(CancellationToken cancellationToken);

    Task<string?> GetUserFirstNameAsync(int crmUserId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CrmCaption>> GetCaptionsAsync(string family, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> GetCustomerCompanyNamesAsync(CancellationToken cancellationToken);

    Task UpdateCaseAsync(
        int caseId,
        string title,
        string problem,
        string solution,
        string? productCode,
        string? versionCode,
        CancellationToken cancellationToken);
}