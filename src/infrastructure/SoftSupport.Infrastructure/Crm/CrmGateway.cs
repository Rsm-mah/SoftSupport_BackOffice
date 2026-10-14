using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Infrastructure.Crm;

public sealed class CrmGateway(CrmDbContext crm) : ICrmGateway
{
    public async Task<IReadOnlyList<CrmCase>> GetKnowledgeBaseCasesAsync(CancellationToken cancellationToken) =>
        await crm.Cases.AsNoTracking()
            .Where(item => item.KnowledgeBaseProposal != null
                && item.IsKnowledgeBase == "Y"
                && item.KnowledgeBaseRefused == null
                && item.ProductCode != null)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyDictionary<int, string?>> GetUserEmailsAsync(CancellationToken cancellationToken) =>
        await crm.Users.AsNoTracking().ToDictionaryAsync(user => user.Id, user => user.Email, cancellationToken);

    public Task<string?> GetUserFirstNameAsync(int crmUserId, CancellationToken cancellationToken) =>
        crm.Users.AsNoTracking()
            .Where(user => user.Id == crmUserId)
            .Select(user => user.FirstName)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<CrmCaption>> GetCaptionsAsync(string family, CancellationToken cancellationToken) =>
        await crm.Captions.AsNoTracking()
            .Where(caption => caption.Family == family)
            .OrderBy(caption => caption.Order)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<string>> GetCustomerCompanyNamesAsync(CancellationToken cancellationToken) =>
        await crm.Companies.AsNoTracking()
            .Where(company => company.Type == "customer" && company.Name != null && company.Name != "")
            .Select(company => company.Name!)
            .Distinct()
            .OrderBy(name => name)
            .ToListAsync(cancellationToken);

    public async Task UpdateCaseAsync(
        int caseId,
        string title,
        string problem,
        string solution,
        string? productCode,
        string? versionCode,
        CancellationToken cancellationToken)
    {
        var item = await crm.Cases.FirstOrDefaultAsync(entry => entry.Id == caseId, cancellationToken);
        if (item is null)
        {
            return;
        }

        item.ApplyArticle(title, problem, solution, productCode, versionCode);
        await crm.SaveChangesAsync(cancellationToken);
    }
}
