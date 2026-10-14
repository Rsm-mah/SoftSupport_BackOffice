using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Customers;
using SoftSupport.Application.Interfaces;
using SoftSupport.Application.Mail;
using SoftSupport.Domain;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

public sealed class CompanyService(
    ICompanyRepository companies,
    ICrmGateway crm,
    IEmailQueue emailQueue,
    IOptions<SoftSupportOptions> options,
    TimeProvider clock,
    ILogger<CompanyService> logger) : ICompanyService
{
    public Task<IReadOnlyList<CompanyListItemDto>> GetListAsync(CancellationToken cancellationToken) =>
        companies.GetListAsync(cancellationToken);

    public async Task<CompanyDetailDto> GetDetailAsync(int companyId, CancellationToken cancellationToken) =>
        await companies.GetDetailAsync(companyId, cancellationToken) ?? throw new KeyNotFoundException("Société introuvable.");

    /// <summary>Sociétés clientes du CRM, proposées à la saisie d'une nouvelle société.</summary>
    public async Task<IReadOnlyList<string>> GetCrmCompanyNamesAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await crm.GetCustomerCompanyNamesAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "CRM indisponible : liste des sociétés non chargée");
            return [];
        }
    }

    public async Task<ApiResponse<CompanySavedDto>> CreateAsync(CreateCompanyRequest request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (await companies.NameExistsAsync(name, cancellationToken))
        {
            throw new SoftSupportConflictException("Cette société existe déjà.");
        }

        var contracts = Distinct(request.Contracts);
        contracts.ForEach(contract => ContractRules.EnsureValidPeriod(contract.StartDate, contract.EndDate));
        await EnsureProductsExistAsync(contracts.Select(contract => contract.ProductId), cancellationToken);
        var admin = HasEmail(request.Admin) ? request.Admin : null;
        if (admin is not null)
        {
            await EnsureCustomerEmailFreeAsync(admin.Email, null, cancellationToken);
        }

        var now = clock.GetLocalNow().DateTime;
        string? password = null;
        var company = Company.Create(name, request.ShortName, request.UserNumber);

        await companies.InTransactionAsync(async () =>
        {
            await companies.AddAsync(company, cancellationToken);
            await companies.SaveChangesAsync(cancellationToken);

            foreach (var contract in contracts)
            {
                var line = ContractLine.Create(company.Id, contract.ProductId, contract.StartDate, contract.EndDate);
                companies.AddContractLine(line);
                companies.AddHistory(ContractHistory.Record(ContractHistoryType.Creation, company, line, now));
            }

            if (admin is not null)
            {
                password = TemporaryPassword.Generate();
                companies.AddCustomer(Customer.Create(company.Id, admin.FirstName, admin.LastName, admin.Email, admin.Function, true, password));
            }

            await companies.SaveChangesAsync(cancellationToken);
            return true;
        }, cancellationToken);

        logger.LogInformation("Société {CompanyId} créée avec {Count} contrat(s)", company.Id, contracts.Count);
        if (admin is not null && password is not null)
        {
            emailQueue.Enqueue(SoftSupportMailTemplates.CustomerCredentials(
                admin.Email.Trim(),
                admin.FirstName,
                password,
                options.Value.CustomerPortalUrl));
        }

        return ApiResponse<CompanySavedDto>.Ok(
            new CompanySavedDto(company.Id, admin?.Email.Trim(), password),
            admin is null
                ? $"La société « {company.Name} » a été créée."
                : $"La société « {company.Name} » a été créée. Les identifiants ont été envoyés à {admin.Email.Trim()}.");
    }

    public async Task<string> UpdateAsync(int companyId, UpdateCompanyRequest request, CancellationToken cancellationToken)
    {
        var company = await RequireAsync(companyId, cancellationToken);
        var contracts = Distinct(request.Contracts);
        contracts.ForEach(contract => ContractRules.EnsureValidPeriod(contract.StartDate, contract.EndDate));
        await EnsureProductsExistAsync(contracts.Select(contract => contract.ProductId), cancellationToken);
        var now = clock.GetLocalNow().DateTime;

        var customers = await companies.GetCustomersAsync(companyId, cancellationToken);
        var admin = customers.FirstOrDefault(customer => customer.IsAdmin);
        string? newAdminPassword = null;
        if (HasEmail(request.Admin))
        {
            await EnsureCustomerEmailFreeAsync(request.Admin!.Email, admin?.Id, cancellationToken);
        }

        await companies.InTransactionAsync(async () =>
        {
            company.Update(request.ShortName, request.UserNumber);
            var lines = await companies.GetContractLinesAsync(companyId, cancellationToken);
            var selected = contracts.ToDictionary(contract => contract.ProductId);

            foreach (var line in lines.Where(line => !selected.ContainsKey(line.ProductId)))
            {
                companies.AddHistory(ContractHistory.Record(ContractHistoryType.Suppression, company, line, now));
                companies.RemoveContractLine(line);
            }

            foreach (var contract in contracts)
            {
                var latest = lines
                    .Where(line => line.ProductId == contract.ProductId)
                    .OrderByDescending(line => line.StartDate)
                    .FirstOrDefault();

                if (latest is null)
                {
                    var line = ContractLine.Create(companyId, contract.ProductId, contract.StartDate, contract.EndDate);
                    companies.AddContractLine(line);
                    companies.AddHistory(ContractHistory.Record(ContractHistoryType.Creation, company, line, now));
                }
                else if (latest.StartDate.Date != contract.StartDate.Date || latest.EndDate.Date != contract.EndDate.Date)
                {
                    latest.Change(contract.ProductId, contract.StartDate, contract.EndDate);
                    companies.AddHistory(ContractHistory.Record(ContractHistoryType.Modification, company, latest, now));
                }
            }

            if (HasEmail(request.Admin))
            {
                var input = request.Admin!;
                if (admin is null)
                {
                    newAdminPassword = TemporaryPassword.Generate();
                    companies.AddCustomer(Customer.Create(companyId, input.FirstName, input.LastName, input.Email, input.Function, true, newAdminPassword));
                }
                else
                {
                    admin.Update(input.FirstName, input.LastName, input.Email, input.Function, true);
                }
            }

            await companies.SaveChangesAsync(cancellationToken);
            return true;
        }, cancellationToken);

        logger.LogInformation("Société {CompanyId} modifiée", companyId);
        if (newAdminPassword is not null)
        {
            emailQueue.Enqueue(SoftSupportMailTemplates.CustomerCredentials(
                request.Admin!.Email.Trim(),
                request.Admin.FirstName,
                newAdminPassword,
                options.Value.CustomerPortalUrl));
            return $"La société « {company.Name} » a été modifiée. Les identifiants de l'administrateur ont été envoyés à {request.Admin.Email.Trim()}.";
        }

        return $"La société « {company.Name} » a été modifiée.";
    }

    /// <summary>Supprime la société, ses contrats (tracés dans l'historique) et ses utilisateurs.</summary>
    public async Task<string> DeleteAsync(int companyId, CancellationToken cancellationToken)
    {
        var company = await RequireAsync(companyId, cancellationToken);
        var now = clock.GetLocalNow().DateTime;

        await companies.InTransactionAsync(async () =>
        {
            foreach (var line in await companies.GetContractLinesAsync(companyId, cancellationToken))
            {
                companies.AddHistory(ContractHistory.Record(ContractHistoryType.Suppression, company, line, now));
                companies.RemoveContractLine(line);
            }

            foreach (var customer in await companies.GetCustomersAsync(companyId, cancellationToken))
            {
                companies.RemoveCustomer(customer);
            }

            companies.Remove(company);
            await companies.SaveChangesAsync(cancellationToken);
            return true;
        }, cancellationToken);

        logger.LogInformation("Société {CompanyId} supprimée", companyId);
        return $"La société « {company.Name} » et ses contrats ont été supprimés.";
    }

    public async Task<IReadOnlyList<ContractLineDto>> GetProductContractsAsync(
        int companyId,
        int productId,
        CancellationToken cancellationToken)
    {
        await RequireAsync(companyId, cancellationToken);
        return await companies.GetProductContractsAsync(companyId, productId, cancellationToken);
    }

    public async Task<string> AddContractAsync(int companyId, SaveContractRequest request, CancellationToken cancellationToken)
    {
        var company = await RequireAsync(companyId, cancellationToken);
        await EnsureProductsExistAsync([request.ProductId], cancellationToken);
        ContractRules.EnsureValidPeriod(request.StartDate, request.EndDate);
        ContractRules.EnsureMinimumDuration(request.StartDate, request.EndDate);

        var line = ContractLine.Create(companyId, request.ProductId, request.StartDate, request.EndDate);
        companies.AddContractLine(line);
        companies.AddHistory(ContractHistory.Record(ContractHistoryType.Creation, company, line, clock.GetLocalNow().DateTime));
        await companies.SaveChangesAsync(cancellationToken);
        return "Le contrat a été ajouté.";
    }

    public async Task<string> UpdateContractAsync(int contractId, SaveContractRequest request, CancellationToken cancellationToken)
    {
        var line = await companies.FindContractLineAsync(contractId, cancellationToken)
            ?? throw new KeyNotFoundException("Contrat introuvable.");
        var company = await RequireAsync(line.CompanyId, cancellationToken);
        await EnsureProductsExistAsync([request.ProductId], cancellationToken);

        // Les autres périodes du même produit encadrent la période modifiée.
        var siblings = (await companies.GetContractLinesAsync(line.CompanyId, cancellationToken))
            .Where(other => other.Id != line.Id && other.ProductId == request.ProductId)
            .ToList();
        var previousEnd = siblings.Where(other => other.StartDate.Date < request.StartDate.Date)
            .Select(other => (DateTime?)other.EndDate)
            .Max();
        var nextStart = siblings.Where(other => other.StartDate.Date > request.StartDate.Date)
            .Select(other => (DateTime?)other.StartDate)
            .Min();
        ContractRules.EnsureFitsBetween(previousEnd, nextStart, request.StartDate, request.EndDate);

        line.Change(request.ProductId, request.StartDate, request.EndDate);
        companies.AddHistory(ContractHistory.Record(ContractHistoryType.Modification, company, line, clock.GetLocalNow().DateTime));
        await companies.SaveChangesAsync(cancellationToken);
        return "Le contrat a été modifié.";
    }

    public async Task<string> RenewContractAsync(int companyId, SaveContractRequest request, CancellationToken cancellationToken)
    {
        var company = await RequireAsync(companyId, cancellationToken);
        var last = (await companies.GetContractLinesAsync(companyId, cancellationToken))
            .Where(line => line.ProductId == request.ProductId)
            .OrderByDescending(line => line.EndDate)
            .FirstOrDefault()
            ?? throw new SoftSupportDomainException("Aucun contrat à renouveler pour ce produit.");

        ContractRules.EnsureRenewalAfter(last.StartDate, last.EndDate, request.StartDate, request.EndDate);
        var line = ContractLine.Create(companyId, request.ProductId, request.StartDate, request.EndDate);
        companies.AddContractLine(line);
        companies.AddHistory(ContractHistory.Record(ContractHistoryType.Renouvellement, company, line, clock.GetLocalNow().DateTime));
        await companies.SaveChangesAsync(cancellationToken);
        return "Le contrat a été renouvelé.";
    }

    public async Task<string> DeleteContractAsync(int contractId, CancellationToken cancellationToken)
    {
        var line = await companies.FindContractLineAsync(contractId, cancellationToken)
            ?? throw new KeyNotFoundException("Contrat introuvable.");
        var company = await RequireAsync(line.CompanyId, cancellationToken);
        companies.AddHistory(ContractHistory.Record(ContractHistoryType.Suppression, company, line, clock.GetLocalNow().DateTime));
        companies.RemoveContractLine(line);
        await companies.SaveChangesAsync(cancellationToken);
        return "Le contrat a été supprimé.";
    }

    public async Task<ApiResponse<CustomerSavedDto>> AddCustomerAsync(
        int companyId,
        SaveCustomerRequest request,
        CancellationToken cancellationToken)
    {
        await RequireAsync(companyId, cancellationToken);
        await EnsureCustomerEmailFreeAsync(request.Email, null, cancellationToken);

        var password = TemporaryPassword.Generate();
        var customer = Customer.Create(companyId, request.FirstName, request.LastName, request.Email, request.Function, request.IsAdmin, password);
        companies.AddCustomer(customer);
        await companies.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Utilisateur client {CustomerId} créé pour la société {CompanyId}", customer.Id, companyId);

        var sent = SendCredentials(request.SendCredentials, customer, password);
        return ApiResponse<CustomerSavedDto>.Ok(
            new CustomerSavedDto(customer.Id, password),
            sent ? $"Utilisateur créé. Ses identifiants ont été envoyés à {customer.Email}." : "Utilisateur créé.");
    }

    public async Task<ApiResponse<CustomerSavedDto>> UpdateCustomerAsync(
        int customerId,
        SaveCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var customer = await companies.FindCustomerAsync(customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Utilisateur client introuvable.");
        await EnsureCustomerEmailFreeAsync(request.Email, customerId, cancellationToken);

        customer.Update(request.FirstName, request.LastName, request.Email, request.Function, request.IsAdmin);
        string? password = null;
        if (request.ResetPassword)
        {
            password = TemporaryPassword.Generate();
            customer.ResetPassword(password);
        }

        await companies.SaveChangesAsync(cancellationToken);
        var sent = password is not null && SendCredentials(request.SendCredentials, customer, password);
        return ApiResponse<CustomerSavedDto>.Ok(
            new CustomerSavedDto(customer.Id, password),
            password is null
                ? "Utilisateur modifié."
                : sent ? $"Mot de passe réinitialisé et envoyé à {customer.Email}." : "Mot de passe réinitialisé.");
    }

    public async Task<string> DeleteCustomerAsync(int customerId, CancellationToken cancellationToken)
    {
        var customer = await companies.FindCustomerAsync(customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Utilisateur client introuvable.");
        companies.RemoveCustomer(customer);
        await companies.SaveChangesAsync(cancellationToken);
        return "L'utilisateur a été supprimé.";
    }

    public Task<PagedResult<ContractHistoryItemDto>> SearchHistoryAsync(
        ContractHistoryQuery query,
        CancellationToken cancellationToken) =>
        companies.SearchHistoryAsync(query, cancellationToken);

    private bool SendCredentials(bool requested, Customer customer, string password)
    {
        if (!requested)
        {
            return false;
        }

        emailQueue.Enqueue(SoftSupportMailTemplates.CustomerCredentials(
            customer.Email,
            customer.FirstName,
            password,
            options.Value.CustomerPortalUrl));
        return true;
    }

    private async Task EnsureProductsExistAsync(IEnumerable<int> productIds, CancellationToken cancellationToken)
    {
        foreach (var productId in productIds.Distinct())
        {
            if (!await companies.ProductExistsAsync(productId, cancellationToken))
            {
                throw new SoftSupportDomainException("Un des produits choisis est introuvable.");
            }
        }
    }

    private async Task EnsureCustomerEmailFreeAsync(string email, int? excludedCustomerId, CancellationToken cancellationToken)
    {
        if (await companies.CustomerEmailExistsAsync(email.Trim(), excludedCustomerId, cancellationToken))
        {
            throw new SoftSupportConflictException("Cette adresse e-mail est déjà utilisée par un autre utilisateur client.");
        }
    }

    private async Task<Company> RequireAsync(int companyId, CancellationToken cancellationToken) =>
        await companies.FindAsync(companyId, cancellationToken) ?? throw new KeyNotFoundException("Société introuvable.");

    private static List<ContractInput> Distinct(IReadOnlyList<ContractInput>? contracts) =>
        (contracts ?? []).GroupBy(contract => contract.ProductId).Select(group => group.Last()).ToList();

    private static bool HasEmail(AdminCustomerInput? admin) => !string.IsNullOrWhiteSpace(admin?.Email);
}

/// <summary>Trois mois avant l'échéance, puis chaque lundi du dernier mois, les clients sont prévenus.</summary>
public sealed class ContractAlertService(
    ICompanyRepository companies,
    IEmailQueue emailQueue,
    TimeProvider clock,
    ILogger<ContractAlertService> logger) : IContractAlertService
{
    public async Task<int> SendDueAlertsAsync(CancellationToken cancellationToken)
    {
        var today = clock.GetLocalNow().Date;
        var sent = 0;
        foreach (var contract in await companies.GetRunningContractsAsync(today, cancellationToken))
        {
            var subject = ContractAlerts.Evaluate(contract.EndDate, today) switch
            {
                ContractAlerts.Kind.ThreeMonths => "Alerte : contrat expirant dans 3 mois",
                ContractAlerts.Kind.Soon => "Rappel : contrat expirant bientôt",
                _ => null,
            };

            if (subject is null)
            {
                continue;
            }

            if (contract.CustomerEmails.Count == 0)
            {
                logger.LogWarning("Contrat {ContractId} ({Company}) : aucun utilisateur à prévenir", contract.ContractId, contract.CompanyName);
                continue;
            }

            emailQueue.Enqueue(SoftSupportMailTemplates.ContractExpiring(contract.CustomerEmails, subject, contract.ProductName, contract.EndDate));
            sent++;
        }

        logger.LogInformation("{Count} alerte(s) d'échéance de contrat envoyée(s)", sent);
        return sent;
    }
}
