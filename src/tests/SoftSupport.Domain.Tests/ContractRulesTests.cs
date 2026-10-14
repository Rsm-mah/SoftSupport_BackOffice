using SoftSupport.Domain;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Tests;

public sealed class ContractRulesTests
{
    private static readonly DateTime Start = new(2026, 1, 1);

    [Fact]
    public void The_end_must_follow_the_start() =>
        Assert.Throws<SoftSupportDomainException>(() => ContractRules.EnsureValidPeriod(Start, Start));

    [Fact]
    public void An_added_contract_lasts_at_least_three_months()
    {
        Assert.Throws<SoftSupportDomainException>(() => ContractRules.EnsureMinimumDuration(Start, Start.AddDays(89)));
        ContractRules.EnsureMinimumDuration(Start, Start.AddDays(90));
    }

    [Fact]
    public void A_renewal_starts_and_ends_after_the_last_period()
    {
        var lastEnd = Start.AddYears(1);
        Assert.Throws<SoftSupportDomainException>(() =>
            ContractRules.EnsureRenewalAfter(Start, lastEnd, Start, lastEnd.AddYears(1)));
        Assert.Throws<SoftSupportDomainException>(() =>
            ContractRules.EnsureRenewalAfter(Start, lastEnd, lastEnd, lastEnd));
        ContractRules.EnsureRenewalAfter(Start, lastEnd, lastEnd.AddDays(1), lastEnd.AddYears(1));
    }

    [Fact]
    public void A_modified_period_stays_between_its_neighbours()
    {
        var previousEnd = Start.AddMonths(6);
        var nextStart = Start.AddYears(2);
        Assert.Throws<SoftSupportDomainException>(() =>
            ContractRules.EnsureFitsBetween(previousEnd, nextStart, Start.AddMonths(5), Start.AddYears(1)));
        Assert.Throws<SoftSupportDomainException>(() =>
            ContractRules.EnsureFitsBetween(previousEnd, nextStart, previousEnd, nextStart.AddDays(1)));
        ContractRules.EnsureFitsBetween(previousEnd, nextStart, previousEnd, nextStart);
    }
}

public sealed class ContractAlertsTests
{
    [Fact]
    public void Alerts_three_months_before_the_end()
    {
        var today = new DateTime(2026, 10, 7);
        Assert.Equal(ContractAlerts.Kind.ThreeMonths, ContractAlerts.Evaluate(today.AddDays(90), today));
        Assert.Equal(ContractAlerts.Kind.None, ContractAlerts.Evaluate(today.AddDays(60), today));
    }

    [Fact]
    public void Reminds_every_monday_of_the_last_month()
    {
        var monday = new DateTime(2026, 10, 5);
        var tuesday = monday.AddDays(1);
        Assert.Equal(ContractAlerts.Kind.Soon, ContractAlerts.Evaluate(monday.AddDays(20), monday));
        Assert.Equal(ContractAlerts.Kind.None, ContractAlerts.Evaluate(tuesday.AddDays(20), tuesday));
        Assert.Equal(ContractAlerts.Kind.None, ContractAlerts.Evaluate(monday.AddDays(-1), monday));
    }

    [Fact]
    public void Temporary_passwords_are_random_and_sized()
    {
        var first = TemporaryPassword.Generate();
        Assert.Equal(12, first.Length);
        Assert.NotEqual(first, TemporaryPassword.Generate());
    }
}
