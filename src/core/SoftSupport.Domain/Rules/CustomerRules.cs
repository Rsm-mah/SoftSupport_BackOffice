namespace SoftSupport.Domain.Rules;

public static class CustomerRules
{
    public static void EnsureValidIdentity(string? firstName, string? lastName, string? email)
    {
        if (string.IsNullOrWhiteSpace(firstName))
        {
            throw new SoftSupportDomainException("Le prénom du client est obligatoire.");
        }

        if (string.IsNullOrWhiteSpace(lastName))
        {
            throw new SoftSupportDomainException("Le nom de famille du client est obligatoire.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new SoftSupportDomainException("L'adresse e-mail du client est obligatoire.");
        }
    }

    public static string? NormalizeFunction(string? function) =>
        string.IsNullOrWhiteSpace(function) ? null : function.Trim();
}