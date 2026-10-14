namespace SoftSupport.Infrastructure.Security;

/// <summary>Paramètres des jetons d'accès (section <c>Jwt</c>).</summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "SoftSupport";
    public string Audience { get; set; } = "SoftSupport";

    /// <summary>Durée de validité d'un jeton, en minutes.</summary>
    public int ExpirationMinutes { get; set; } = 720;
}

/// <summary>Noms des claims portées par le jeton SoftSupport, lues par le front et par l'API.</summary>
public static class SoftSupportClaims
{
    public const string FirstName = "first_name";
    public const string LastName = "last_name";
    public const string RoleName = "role_name";
    public const string DepartementName = "departement_name";
    public const string IsValidator = "is_validator";
}
