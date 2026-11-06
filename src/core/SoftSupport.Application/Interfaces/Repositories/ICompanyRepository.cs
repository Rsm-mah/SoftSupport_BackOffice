using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Customers;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface ICompanyRepository
{
    Task<IReadOnlyList<CompanyListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CompanyDetailDto?> GetDetailAsync(int companyId, CancellationToken cancellationToken);

    Task<Company?> FindAsync(int companyId, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, CancellationToken cancellationToken);

    Task<List<CompanyProduct>> GetContractLinesAsync(int companyId, CancellationToken cancellationToken);

    Task<CompanyProduct?> FindContractLineAsync(int contractLineId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ContractLineDto>> GetProductContractsAsync(
        int companyId,
        int productId,
        CancellationToken cancellationToken);

    Task<List<Customer>> GetCustomersAsync(int companyId, CancellationToken cancellationToken);

    Task<Customer?> FindCustomerAsync(int customerId, CancellationToken cancellationToken);

    Task<bool> CustomerEmailExistsAsync(string email, int? excludedCustomerId, CancellationToken cancellationToken);

    Task<bool> ProductExistsAsync(int productId, CancellationToken cancellationToken);

    Task<PagedResult<ContractHistoryItemDto>> SearchHistoryAsync(
        ContractHistoryQuery query,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ExpiringContract>> GetRunningContractsAsync(DateTime today, CancellationToken cancellationToken);

    Task AddAsync(Company company, CancellationToken cancellationToken);

    void Remove(Company company);

    void AddContractLine(CompanyProduct line);

    void RemoveContractLine(CompanyProduct line);

    void AddCustomer(Customer customer);

    void RemoveCustomer(Customer customer);

    void AddHistory(ContractHistory history);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task<T> InTransactionAsync<T>(Func<Task<T>> work, CancellationToken cancellationToken);
}