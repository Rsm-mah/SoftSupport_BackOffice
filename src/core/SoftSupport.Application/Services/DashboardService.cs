using SoftSupport.Application.DTOs.Dashboard;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

public sealed class DashboardService(IDashboardRepository dashboard, TimeProvider clock) : IDashboardService
{
    public const int RankingSize = 10;

    public async Task<ArticleDashboardDto> GetArticlesAsync(CancellationToken cancellationToken)
    {
        var stats = await dashboard.GetArticleStatsAsync(cancellationToken);

        var mostRead = stats
            .Where(article => article.ViewNumber > 0)
            .OrderByDescending(article => article.ViewNumber)
            .ThenByDescending(article => article.Likes)
            .ThenBy(article => article.Code)
            .Take(RankingSize)
            .Select(ToTopArticle)
            .ToList();

        var poorlyRated = stats.Where(article => ArticleRating.IsPoorlyRated(article.Likes, article.Dislikes)).ToList();
        var worstRated = poorlyRated
            .OrderBy(article => ArticleRating.Balance(article.Likes, article.Dislikes))
            .ThenByDescending(article => article.Dislikes)
            .ThenByDescending(article => article.ViewNumber)
            .Take(RankingSize)
            .Select(ToTopArticle)
            .ToList();

        return new ArticleDashboardDto(
            stats.Count,
            stats.Sum(article => article.ViewNumber),
            stats.Sum(article => article.Likes),
            stats.Sum(article => article.Dislikes),
            poorlyRated.Count,
            mostRead,
            worstRated);
    }

    public async Task<CustomerDashboardDto> GetCustomersAsync(CancellationToken cancellationToken)
    {
        var today = clock.GetLocalNow().DateTime.Date;
        var (monthStart, monthEnd) = DashboardPeriod.MonthOf(today);

        var expiring = (await dashboard.GetContractsEndingAsync(monthStart, monthEnd, cancellationToken))
            .Select(row => new ExpiringContractItemDto(
                row.ContractId,
                row.CompanyId,
                row.CompanyName,
                row.ProductName,
                row.StartDate,
                row.EndDate,
                DashboardPeriod.DaysLeft(row.EndDate, today),
                row.Renewed))
            .OrderBy(contract => contract.EndDate)
            .ThenBy(contract => contract.CompanyName)
            .ToList();

        var quotas = (await dashboard.GetCompanyAccountsAsync(cancellationToken))
            .Select(row => new CompanyQuotaDto(
                row.CompanyId,
                row.CompanyName,
                row.ShortName,
                row.UserNumber,
                row.AccountCount,
                CustomerQuota.StatusOf(row.AccountCount, row.UserNumber)))
            .OrderByDescending(company => company.Status)
            .ThenBy(company => company.CompanyName)
            .ToList();

        return new CustomerDashboardDto(
            monthStart,
            monthEnd,
            expiring,
            expiring.Count(contract => !contract.Renewed && contract.DaysLeft >= 0),
            quotas,
            quotas.Count(company => company.Status == QuotaStatus.Full),
            quotas.Count(company => company.Status == QuotaStatus.Exceeded));
    }

    private static TopArticleDto ToTopArticle(ArticleVoteStats article) =>
        new(
            article.ArticleId,
            article.Code,
            article.Title,
            article.ProductName,
            article.ViewNumber,
            article.Likes,
            article.Dislikes,
            ArticleRating.SatisfactionPercent(article.Likes, article.Dislikes));
}
