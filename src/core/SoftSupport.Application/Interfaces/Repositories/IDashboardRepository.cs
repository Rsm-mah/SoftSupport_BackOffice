using SoftSupport.Application.DTOs.Dashboard;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IDashboardRepository
{
    Task<IReadOnlyList<ArticleVoteStats>> GetArticleStatsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ContractEndingRow>> GetContractsEndingAsync(DateTime from, DateTime to, CancellationToken cancellationToken);

    Task<IReadOnlyList<CompanyAccountsRow>> GetCompanyAccountsAsync(CancellationToken cancellationToken);
}