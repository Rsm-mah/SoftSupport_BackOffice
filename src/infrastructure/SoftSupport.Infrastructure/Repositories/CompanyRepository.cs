using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Customers;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain.Entities;
using SoftSupport.Infrastructure.Persistence;

namespace SoftSupport.Infrastructure.Repositories;

public sealed class CompanyRepository(SoftSupportDbContext db, TimeProvider clock) : ICompanyRepository
{
    public async Task<IReadOnlyList<CompanyListItemDto>> GetListAsync(CancellationToken cancellationToken)
    {
        var today = clock.GetLocalNow().Date;
        var companies = await db.Companies.AsNoTracking()
            .OrderBy(company => company.Name)
            .Select(company => new
            {
                company.Id,
                company.Name,
                company.ShortName,
                company.UserNumber,
                ContractCount = db.ContractLines.Count(line => line.CompanyId == company.Id),
                NextEndDate = db.ContractLines
                    .Where(line => line.CompanyId == company.Id && line.EndDate >= today)
                    .Min(line => (DateTime?)line.EndDate),
            })
            .ToListAsync(cancellationToken);

        var customers = (await CustomerRows(db.Customers.AsNoTracking()).ToListAsync(cancellationToken))
            .ToLookup(row => row.CompanyId, row => row.Customer);

        return companies
            .Select(company => new CompanyListItemDto(
                company.Id,
                company.Name,
                company.ShortName,
                company.UserNumber,
                company.ContractCount,
                company.NextEndDate,
                customers[company.Id].ToList()))
            .ToList();
    }

    public async Task<CompanyDetailDto?> GetDetailAsync(int companyId, CancellationToken cancellationToken)
    {
        var company = await db.Companies.AsNoTracking().FirstOrDefaultAsync(item => item.Id == companyId, cancellationToken);
        if (company is null)
        {
            return null;
        }

        var contracts = (await ContractRows(db.ContractLines.AsNoTracking().Where(line => line.CompanyId == companyId))
                .ToListAsync(cancellationToken))
            .OrderBy(line => line.ProductName, StringComparer.CurrentCultureIgnoreCase)
            .ThenByDescending(line => line.StartDate)
            .ToList();
        var customers = (await CustomerRows(db.Customers.AsNoTracking().Where(customer => customer.CompanyId == companyId))
                .ToListAsync(cancellationToken))
            .Select(row => row.Customer)
            .ToList();

        return new CompanyDetailDto(company.Id, company.Name, company.ShortName, company.UserNumber, contracts, customers);
    }

    public Task<Company?> FindAsync(int companyId, CancellationToken cancellationToken) =>
        db.Companies.FirstOrDefaultAsync(company => company.Id == companyId, cancellationToken);

    public Task<bool> NameExistsAsync(string name, CancellationToken cancellationToken) =>
        db.Companies.AnyAsync(company => company.Name == name, cancellationToken);

    public Task<List<ContractLine>> GetContractLinesAsync(int companyId, CancellationToken cancellationToken) =>
        db.ContractLines.Where(line => line.CompanyId == companyId).ToListAsync(cancellationToken);

    public Task<ContractLine?> FindContractLineAsync(int contractLineId, CancellationToken cancellationToken) =>
        db.ContractLines.FirstOrDefaultAsync(line => line.Id == contractLineId, cancellationToken);

    public async Task<IReadOnlyList<ContractLineDto>> GetProductContractsAsync(
        int companyId,
        int productId,
        CancellationToken cancellationToken) =>
        await ContractRows(db.ContractLines.AsNoTracking()
                .Where(line => line.CompanyId == companyId && line.ProductId == productId)
                .OrderByDescending(line => line.EndDate))
            .ToListAsync(cancellationToken);

    public Task<List<Customer>> GetCustomersAsync(int companyId, CancellationToken cancellationToken) =>
        db.Customers.Where(customer => customer.CompanyId == companyId).ToListAsync(cancellationToken);

    public Task<Customer?> FindCustomerAsync(int customerId, CancellationToken cancellationToken) =>
        db.Customers.FirstOrDefaultAsync(customer => customer.Id == customerId, cancellationToken);

    public Task<bool> CustomerEmailExistsAsync(string email, int? excludedCustomerId, CancellationToken cancellationToken) =>
        db.Customers.AnyAsync(
            customer => customer.Email == email && (excludedCustomerId == null || customer.Id != excludedCustomerId),
            cancellationToken);

    public Task<bool> ProductExistsAsync(int productId, CancellationToken cancellationToken) =>
        db.Products.AnyAsync(product => product.Id == productId, cancellationToken);

    public async Task<PagedResult<ContractHistoryItemDto>> SearchHistoryAsync(
        ContractHistoryQuery query,
        CancellationToken cancellationToken)
    {
        var rows = db.ContractHistories.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            rows = rows.Where(history => history.CompanyName.Contains(term));
        }

        if (Enum.TryParse<ContractHistoryType>(query.Type, ignoreCase: true, out var type))
        {
            rows = rows.Where(history => history.Type == type);
        }

        var totalCount = await rows.CountAsync(cancellationToken);
        var items = await rows
            .OrderByDescending(history => history.CreatedAt)
            .ThenByDescending(history => history.Id)
            .Skip(query.Skip)
            .Take(query.SafePageSize)
            .Select(history => new
            {
                history.Id,
                history.CompanyName,
                history.Type,
                ProductName = db.Products.Where(product => product.Id == history.ProductId).Select(product => product.Name).FirstOrDefault(),
                history.StartDate,
                history.EndDate,
                history.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ContractHistoryItemDto>
        {
            Items = items
                .Select(item => new ContractHistoryItemDto(
                    item.Id,
                    item.CompanyName,
                    item.Type.ToString(),
                    item.ProductName,
                    item.StartDate,
                    item.EndDate,
                    item.CreatedAt))
                .ToList(),
            TotalCount = totalCount,
            Page = query.SafePage,
            PageSize = query.SafePageSize,
        };
    }

    public async Task<IReadOnlyList<ExpiringContract>> GetRunningContractsAsync(DateTime today, CancellationToken cancellationToken)
    {
        var lines = await db.ContractLines.AsNoTracking()
            .Where(line => line.EndDate >= today)
            .Select(line => new
            {
                line.Id,
                line.CompanyId,
                CompanyName = line.Company!.Name,
                ProductName = line.Product!.Name,
                line.EndDate,
            })
            .ToListAsync(cancellationToken);

        var companyIds = lines.Select(line => line.CompanyId).Distinct().ToList();
        var emails = (await db.Customers.AsNoTracking()
                .Where(customer => companyIds.Contains(customer.CompanyId) && customer.Email != "")
                .Select(customer => new { customer.CompanyId, customer.Email })
                .ToListAsync(cancellationToken))
            .ToLookup(row => row.CompanyId, row => row.Email);

        return lines
            .Select(line => new ExpiringContract(
                line.Id,
                line.CompanyName,
                line.ProductName,
                line.EndDate,
                emails[line.CompanyId].Distinct(StringComparer.OrdinalIgnoreCase).ToList()))
            .ToList();
    }

    public async Task AddAsync(Company company, CancellationToken cancellationToken) => await db.Companies.AddAsync(company, cancellationToken);

    public void Remove(Company company) => db.Companies.Remove(company);

    public void AddContractLine(ContractLine line) => db.ContractLines.Add(line);

    public void RemoveContractLine(ContractLine line) => db.ContractLines.Remove(line);

    public void AddCustomer(Customer customer) => db.Customers.Add(customer);

    public void RemoveCustomer(Customer customer) => db.Customers.Remove(customer);

    public void AddHistory(ContractHistory history) => db.ContractHistories.Add(history);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);

    public Task<T> InTransactionAsync<T>(Func<Task<T>> work, CancellationToken cancellationToken)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        return strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            var result = await work();
            await transaction.CommitAsync(cancellationToken);
            return result;
        });
    }

    private IQueryable<ContractLineDto> ContractRows(IQueryable<ContractLine> lines) =>
        lines.Select(line => new ContractLineDto(
            line.Id,
            line.ProductId,
            db.Products.Where(product => product.Id == line.ProductId).Select(product => product.Name).FirstOrDefault() ?? "",
            line.StartDate,
            line.EndDate));

    private static IQueryable<CustomerRow> CustomerRows(IQueryable<Customer> customers) =>
        customers
            .OrderByDescending(customer => customer.IsAdmin)
            .ThenBy(customer => customer.FirstName)
            .Select(customer => new CustomerRow(
                customer.CompanyId,
                new CustomerDto(customer.Id, customer.FirstName, customer.LastName, customer.Email, customer.Function, customer.IsAdmin)));

    private sealed record CustomerRow(int CompanyId, CustomerDto Customer);
}
