using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Customers;

namespace SoftSupport.Application.Interfaces.Services;

public interface ICompanyService
{
    Task<IReadOnlyList<CompanyListItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<CompanyDetailDto> GetDetailAsync(int companyId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> GetCrmCompanyNamesAsync(CancellationToken cancellationToken);

    Task<ApiResponse<CompanySavedDto>> CreateAsync(CreateCompanyRequest request, CancellationToken cancellationToken);

    Task<string> UpdateAsync(int companyId, UpdateCompanyRequest request, CancellationToken cancellationToken);

    Task<string> DeleteAsync(int companyId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ContractLineDto>> GetProductContractsAsync(int companyId, int productId, CancellationToken cancellationToken);

    Task<string> AddContractAsync(int companyId, SaveContractRequest request, CancellationToken cancellationToken);

    Task<string> UpdateContractAsync(int contractId, SaveContractRequest request, CancellationToken cancellationToken);

    Task<string> RenewContractAsync(int companyId, SaveContractRequest request, CancellationToken cancellationToken);

    Task<string> DeleteContractAsync(int contractId, CancellationToken cancellationToken);

    Task<ApiResponse<CustomerSavedDto>> AddCustomerAsync(int companyId, SaveCustomerRequest request, CancellationToken cancellationToken);

    Task<ApiResponse<CustomerSavedDto>> UpdateCustomerAsync(int customerId, SaveCustomerRequest request, CancellationToken cancellationToken);

    Task<string> DeleteCustomerAsync(int customerId, CancellationToken cancellationToken);

    Task<PagedResult<ContractHistoryItemDto>> SearchHistoryAsync(ContractHistoryQuery query, CancellationToken cancellationToken);
}