namespace SoftSupport.Domain.Rules;

/// <summary>Appréciation des articles par les clients, d'après leurs votes sur le portail.</summary>
public static class ArticleRating
{
    /// <summary>
    /// Un article est « mal noté » dès qu'il a au moins autant de votes négatifs que de votes
    /// positifs, avec au moins un vote négatif.
    /// </summary>
    public static bool IsPoorlyRated(int likes, int dislikes) => dislikes > 0 && dislikes >= likes;

    /// <summary>Solde des votes, du plus mal noté (le plus négatif) au mieux noté.</summary>
    public static int Balance(int likes, int dislikes) => likes - dislikes;

    /// <summary>Part des votes positifs, en pourcentage ; <c>null</c> sans aucun vote.</summary>
    public static int? SatisfactionPercent(int likes, int dislikes) =>
        likes + dislikes == 0 ? null : (int)Math.Round(likes * 100d / (likes + dislikes), MidpointRounding.AwayFromZero);
}

/// <summary>Occupation des comptes clients d'une société par rapport au nombre prévu au contrat.</summary>
public enum QuotaStatus
{
    /// <summary>Des comptes peuvent encore être créés.</summary>
    Available = 0,

    /// <summary>Le nombre de comptes prévu au contrat est atteint.</summary>
    Full = 1,

    /// <summary>Plus de comptes que prévu au contrat (données anciennes ou quota réduit).</summary>
    Exceeded = 2,
}

public static class CustomerQuota
{
    public static QuotaStatus StatusOf(int accounts, int userNumber) =>
        accounts > userNumber ? QuotaStatus.Exceeded
        : accounts == userNumber ? QuotaStatus.Full
        : QuotaStatus.Available;
}

/// <summary>Période couverte par le tableau de bord commercial.</summary>
public static class DashboardPeriod
{
    /// <summary>Premier et dernier jour du mois de <paramref name="today"/> (dates sans heure).</summary>
    public static (DateTime Start, DateTime End) MonthOf(DateTime today)
    {
        var start = new DateTime(today.Year, today.Month, 1);
        return (start, start.AddMonths(1).AddDays(-1));
    }

    /// <summary>Jours restants avant l'échéance ; négatif si elle est passée.</summary>
    public static int DaysLeft(DateTime endDate, DateTime today) => (endDate.Date - today.Date).Days;
}
