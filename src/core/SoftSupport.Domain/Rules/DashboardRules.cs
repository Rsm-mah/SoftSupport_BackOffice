namespace SoftSupport.Domain.Rules;

public static class ArticleRating
{
    public static bool IsPoorlyRated(int likes, int dislikes) => dislikes > 0 && dislikes >= likes;

    public static int Balance(int likes, int dislikes) => likes - dislikes;

    public static int? SatisfactionPercent(int likes, int dislikes) =>
        likes + dislikes == 0 ? null : (int)Math.Round(likes * 100d / (likes + dislikes), MidpointRounding.AwayFromZero);
}

public enum QuotaStatus
{
    Available = 0,

    Full = 1,

    Exceeded = 2,
}

public static class CustomerQuota
{
    public static QuotaStatus StatusOf(int accounts, int userNumber) =>
        accounts > userNumber ? QuotaStatus.Exceeded
        : accounts == userNumber ? QuotaStatus.Full
        : QuotaStatus.Available;
}

public static class DashboardPeriod
{
    public static (DateTime Start, DateTime End) MonthOf(DateTime today)
    {
        var start = new DateTime(today.Year, today.Month, 1);
        return (start, start.AddMonths(1).AddDays(-1));
    }

    public static int DaysLeft(DateTime endDate, DateTime today) => (endDate.Date - today.Date).Days;
}
