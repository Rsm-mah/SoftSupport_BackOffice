using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Entities;

public sealed class CompanyProduct
{
    public int Id { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public int CompanyId { get; private set; }
    public int ProductId { get; private set; }
    public Company? Company { get; private set; }
    public Product? Product { get; private set; }

    public static CompanyProduct Create(int companyId, int productId, DateTime startDate, DateTime endDate)
    {
        ContractRules.EnsureValidPeriod(startDate, endDate);

        var companyProduct = new CompanyProduct
        {
            CompanyId = companyId,
            ProductId = productId,
            StartDate = startDate.Date,
            EndDate = endDate.Date,
        };

        return companyProduct;
    }

    public void Change(int productId, DateTime startDate, DateTime endDate)
    {
        ContractRules.EnsureValidPeriod(startDate, endDate);

        StartDate = startDate.Date;
        EndDate = endDate.Date;
        ProductId = productId;
    }
}