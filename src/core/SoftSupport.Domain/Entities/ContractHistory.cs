using SoftSupport.Domain.Enums;

namespace SoftSupport.Domain.Entities;

public sealed class ContractHistory
{
    public int Id { get; private set; }
    public ContractHistoryType Type { get; private set; }
    public string CompanyName { get; private set; } = string.Empty;
    public int UserNumber { get; private set; }
    public DateTime StartDate { get; private set; }
    public int ProductId { get; private set; }
    public DateTime EndDate { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static ContractHistory Record(
        ContractHistoryType type,
        Company company,
        int productId,
        DateTime startDate,
        DateTime endDate,
        DateTime now) =>
        new()
        {
            Type = type,
            CompanyName = company.Name,
            UserNumber = company.UserNumber,
            ProductId = productId,
            StartDate = startDate,
            EndDate = endDate,
            CreatedAt = now,
        };

    public static ContractHistory Record(ContractHistoryType type, Company company, CompanyProduct line, DateTime now) =>
        Record(type, company, line.ProductId, line.StartDate, line.EndDate, now);
}
