using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Tests;

public sealed class DashboardRulesTests
{
    [Theory]
    [InlineData(0, 0, false)]
    [InlineData(3, 0, false)]
    [InlineData(3, 1, false)]
    [InlineData(1, 1, true)]
    [InlineData(0, 2, true)]
    public void An_article_is_poorly_rated_when_negative_votes_dominate(int likes, int dislikes, bool expected) =>
        Assert.Equal(expected, ArticleRating.IsPoorlyRated(likes, dislikes));

    [Fact]
    public void Satisfaction_is_the_share_of_positive_votes()
    {
        Assert.Null(ArticleRating.SatisfactionPercent(0, 0));
        Assert.Equal(75, ArticleRating.SatisfactionPercent(3, 1));
        Assert.Equal(67, ArticleRating.SatisfactionPercent(2, 1));
        Assert.Equal(-2, ArticleRating.Balance(1, 3));
    }

    [Theory]
    [InlineData(1, 3, QuotaStatus.Available)]
    [InlineData(3, 3, QuotaStatus.Full)]
    [InlineData(4, 3, QuotaStatus.Exceeded)]
    [InlineData(0, 0, QuotaStatus.Full)]
    public void Quota_compares_accounts_with_the_contract(int accounts, int userNumber, QuotaStatus expected) =>
        Assert.Equal(expected, CustomerQuota.StatusOf(accounts, userNumber));

    [Fact]
    public void The_period_is_the_whole_current_month()
    {
        var (start, end) = DashboardPeriod.MonthOf(new DateTime(2026, 2, 17, 15, 30, 0));

        Assert.Equal(new DateTime(2026, 2, 1), start);
        Assert.Equal(new DateTime(2026, 2, 28), end);
    }

    [Fact]
    public void Days_left_ignore_the_time_of_day()
    {
        var today = new DateTime(2026, 10, 13, 18, 0, 0);

        Assert.Equal(18, DashboardPeriod.DaysLeft(new DateTime(2026, 10, 31), today));
        Assert.Equal(0, DashboardPeriod.DaysLeft(new DateTime(2026, 10, 13), today));
        Assert.Equal(-3, DashboardPeriod.DaysLeft(new DateTime(2026, 10, 10), today));
    }
}
