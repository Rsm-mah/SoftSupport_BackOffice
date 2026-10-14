using System.Security.Cryptography;
using System.Text;

namespace SoftSupport.Domain.Rules;

public static class ContractRules
{
    public const int MinimumAddedContractDays = 90;

    public static void EnsureValidPeriod(DateTime startDate, DateTime endDate)
    {
        if (startDate == default || endDate == default)
        {
            throw new SoftSupportDomainException("Les dates de début et de fin du contrat sont obligatoires.");
        }

        if (endDate.Date <= startDate.Date)
        {
            throw new SoftSupportDomainException("La date de fin doit être postérieure à la date de début.");
        }
    }

    public static void EnsureMinimumDuration(DateTime startDate, DateTime endDate)
    {
        if ((endDate.Date - startDate.Date).TotalDays < MinimumAddedContractDays)
        {
            throw new SoftSupportDomainException("La date de fin doit être au moins 3 mois après la date de début.");
        }
    }

    public static void EnsureRenewalAfter(DateTime lastStart, DateTime lastEnd, DateTime startDate, DateTime endDate)
    {
        EnsureValidPeriod(startDate, endDate);
        if (startDate.Date <= lastStart.Date || endDate.Date <= lastEnd.Date)
        {
            throw new SoftSupportDomainException("Un contrat couvre déjà cette période : le renouvellement doit commencer et se terminer après le contrat en cours.");
        }
    }

    public static void EnsureFitsBetween(DateTime? previousEnd, DateTime? nextStart, DateTime startDate, DateTime endDate)
    {
        EnsureValidPeriod(startDate, endDate);
        if (previousEnd is { } end && startDate.Date < end.Date)
        {
            throw new SoftSupportDomainException("La date de début ne peut pas être antérieure à la date de fin du contrat précédent.");
        }

        if (nextStart is { } start && endDate.Date > start.Date)
        {
            throw new SoftSupportDomainException("La date de fin ne peut pas dépasser la date de début du contrat suivant.");
        }
    }
}

public static class ContractAlerts
{
    public enum Kind
    {
        None,
        ThreeMonths,
        Soon,
    }

    public static Kind Evaluate(DateTime endDate, DateTime today)
    {
        var days = (endDate.Date - today.Date).TotalDays;
        if (days < 0)
        {
            return Kind.None;
        }

        if (days is >= 89 and <= 91)
        {
            return Kind.ThreeMonths;
        }

        return days <= 31 && today.DayOfWeek == DayOfWeek.Monday ? Kind.Soon : Kind.None;
    }
}

public static class TemporaryPassword
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";

    public static string Generate(int length = 12)
    {
        var builder = new StringBuilder(length);
        for (var index = 0; index < length; index++)
        {
            builder.Append(Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)]);
        }

        return builder.ToString();
    }
}
