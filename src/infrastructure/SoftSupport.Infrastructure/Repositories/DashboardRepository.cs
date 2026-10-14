using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.DTOs.Dashboard;
using SoftSupport.Application.Interfaces;
using SoftSupport.Infrastructure.Persistence;

namespace SoftSupport.Infrastructure.Repositories;

public sealed class DashboardRepository(SoftSupportDbContext db) : IDashboardRepository
{
    public async Task<IReadOnlyList<ArticleVoteStats>> GetArticleStatsAsync(CancellationToken cancellationToken) =>
        await db.Articles.AsNoTracking()
            .Where(article => article.IsEnabled && article.IsValidated)
            .Select(article => new ArticleVoteStats(
                article.Id,
                article.Code,
                article.Title,
                db.Products.Where(product => product.Id == article.ProductId).Select(product => product.Name).FirstOrDefault(),
                article.ViewNumber,
                db.ArticleVotes.Count(vote => vote.ArticleId == article.Id && vote.IsLike),
                db.ArticleVotes.Count(vote => vote.ArticleId == article.Id && !vote.IsLike)))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ContractEndingRow>> GetContractsEndingAsync(DateTime from, DateTime to, CancellationToken cancellationToken)
    {
        var lastDay = to.Date.AddDays(1);
        return await db.ContractLines.AsNoTracking()
            .Where(line => line.EndDate >= from.Date && line.EndDate < lastDay)
            .Select(line => new ContractEndingRow(
                line.Id,
                line.CompanyId,
                line.Company!.Name,
                line.Product!.Name,
                line.StartDate,
                line.EndDate,
                // Renouvelé : une période plus récente existe pour la même société et le même produit.
                db.ContractLines.Any(next =>
                    next.CompanyId == line.CompanyId
                    && next.ProductId == line.ProductId
                    && next.Id != line.Id
                    && next.EndDate > line.EndDate)))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CompanyAccountsRow>> GetCompanyAccountsAsync(CancellationToken cancellationToken) =>
        await db.Companies.AsNoTracking()
            .Select(company => new CompanyAccountsRow(
                company.Id,
                company.Name,
                company.ShortName,
                company.UserNumber,
                db.Customers.Count(customer => customer.CompanyId == company.Id)))
            .ToListAsync(cancellationToken);
}
