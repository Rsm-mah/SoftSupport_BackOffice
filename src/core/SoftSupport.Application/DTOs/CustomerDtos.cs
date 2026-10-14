using SoftSupport.Application.Common;

namespace SoftSupport.Application.DTOs.Customers;

public sealed record CustomerDto(
    int CustomerId,
    string FirstName,
    string LastName,
    string Email,
    string? Function,
    bool IsAdmin);

public sealed record CompanyListItemDto(
    int CompanyId,
    string Name,
    string ShortName,
    int UserNumber,
    int ContractCount,
    DateTime? NextEndDate,
    IReadOnlyList<CustomerDto> Customers);

public sealed record ContractLineDto(int ContractId, int ProductId, string ProductName, DateTime StartDate, DateTime EndDate);

public sealed record CompanyDetailDto(
    int CompanyId,
    string Name,
    string ShortName,
    int UserNumber,
    IReadOnlyList<ContractLineDto> Contracts,
    IReadOnlyList<CustomerDto> Customers);

public sealed record ContractInput(int ProductId, DateTime StartDate, DateTime EndDate);

public sealed record AdminCustomerInput(string FirstName, string LastName, string Email, string? Function);

public sealed record CreateCompanyRequest(
    string Name,
    string ShortName,
    int UserNumber,
    IReadOnlyList<ContractInput>? Contracts,
    AdminCustomerInput? Admin);

public sealed record UpdateCompanyRequest(
    string ShortName,
    int UserNumber,
    IReadOnlyList<ContractInput>? Contracts,
    AdminCustomerInput? Admin);

public sealed record CompanySavedDto(int CompanyId, string? AdminEmail, string? AdminPassword);

public sealed record SaveContractRequest(int ProductId, DateTime StartDate, DateTime EndDate);

public sealed record SaveCustomerRequest(
    string FirstName,
    string LastName,
    string Email,
    string? Function,
    bool IsAdmin,
    bool ResetPassword,
    bool SendCredentials);

public sealed record CustomerSavedDto(int CustomerId, string? Password);

public sealed record ContractHistoryItemDto(
    int HistoryId,
    string CompanyName,
    string Type,
    string? ProductName,
    DateTime StartDate,
    DateTime EndDate,
    DateTime CreatedAt);

public sealed class ContractHistoryQuery : PagedQuery
{
    public string? Search { get; init; }
    public string? Type { get; init; }
}
