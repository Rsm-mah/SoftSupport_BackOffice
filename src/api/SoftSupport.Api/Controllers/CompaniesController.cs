using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Api.Security;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Customers;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

[Route("api/softsupport/companies")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Commercial)]
public sealed class CompaniesController(ICompanyService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CompanyListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CompanyListItemDto>>>> GetAll(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<CompanyListItemDto>>.Ok(await service.GetListAsync(cancellationToken)));

    [HttpGet("crm-names")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<string>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<string>>>> GetCrmNames(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<string>>.Ok(await service.GetCrmCompanyNamesAsync(cancellationToken)));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CompanyDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CompanyDetailDto>>> Get(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<CompanyDetailDto>.Ok(await service.GetDetailAsync(id, cancellationToken)));

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CompanySavedDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CompanySavedDto>>> Create(
        [FromBody] CreateCompanyRequest request,
        CancellationToken cancellationToken) =>
        Ok(await service.CreateAsync(request, cancellationToken));

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(
        int id,
        [FromBody] UpdateCompanyRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.UpdateAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteAsync(id, cancellationToken)));

    [HttpGet("{id:int}/products/{productId:int}/contracts")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ContractLineDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ContractLineDto>>>> GetProductContracts(
        int id,
        int productId,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ContractLineDto>>.Ok(await service.GetProductContractsAsync(id, productId, cancellationToken)));

    [HttpPost("{id:int}/contracts")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> AddContract(
        int id,
        [FromBody] SaveContractRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.AddContractAsync(id, request, cancellationToken)));

    [HttpPost("{id:int}/contracts/renew")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> RenewContract(
        int id,
        [FromBody] SaveContractRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.RenewContractAsync(id, request, cancellationToken)));

    [HttpPost("{id:int}/customers")]
    [ProducesResponseType(typeof(ApiResponse<CustomerSavedDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CustomerSavedDto>>> AddCustomer(
        int id,
        [FromBody] SaveCustomerRequest request,
        CancellationToken cancellationToken) =>
        Ok(await service.AddCustomerAsync(id, request, cancellationToken));
}

[Route("api/softsupport/contracts")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Commercial)]
public sealed class ContractsController(ICompanyService service) : SoftSupportControllerBase
{
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(
        int id,
        [FromBody] SaveContractRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.UpdateContractAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteContractAsync(id, cancellationToken)));

    [HttpGet("history")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ContractHistoryItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<ContractHistoryItemDto>>>> GetHistory(
        [FromQuery] ContractHistoryQuery query,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<PagedResult<ContractHistoryItemDto>>.Ok(await service.SearchHistoryAsync(query, cancellationToken)));
}

[Route("api/softsupport/customers")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Commercial)]
public sealed class CustomersController(ICompanyService service) : SoftSupportControllerBase
{
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerSavedDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CustomerSavedDto>>> Update(
        int id,
        [FromBody] SaveCustomerRequest request,
        CancellationToken cancellationToken) =>
        Ok(await service.UpdateCustomerAsync(id, request, cancellationToken));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteCustomerAsync(id, cancellationToken)));
}
