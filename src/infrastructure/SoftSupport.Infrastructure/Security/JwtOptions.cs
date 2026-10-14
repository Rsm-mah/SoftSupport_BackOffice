namespace SoftSupport.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "SoftSupport";
    public string Audience { get; set; } = "SoftSupport";

    public int ExpirationMinutes { get; set; } = 720;
}

public static class SoftSupportClaims
{
    public const string FirstName = "first_name";
    public const string LastName = "last_name";
    public const string RoleName = "role_name";
    public const string DepartementName = "departement_name";
    public const string IsValidator = "is_validator";
}
