namespace SoftSupport.Domain.Rules;

public static class CompanyRules
{
    public static void EnsureValidName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new SoftSupportDomainException("Le nom de la société est obligatoire.");
        }
    }

    public static void EnsureValidDetails(string? shortName, int userNumber)
    {
        if (string.IsNullOrWhiteSpace(shortName))
        {
            throw new SoftSupportDomainException("Le nom abrégé est obligatoire.");
        }

        if (userNumber < 0)
        {
            throw new SoftSupportDomainException("Le nombre d'utilisateurs ne peut pas être négatif.");
        }
    }
}