using SoftSupport.Domain.Rules;
using SoftSupport.Infrastructure.Security;

namespace SoftSupport.Api.Security;

public static class SoftSupportAuthorizationPolicies
{
    public const string Administration = "SoftSupport.Administration";

    public const string Redaction = "SoftSupport.Redaction";

    public const string Commercial = "SoftSupport.Commercial";

    public const string CatalogLookup = "SoftSupport.CatalogLookup";

    public static IServiceCollection AddSoftSupportAuthorization(this IServiceCollection services)
    {
        services.AddAuthorizationBuilder()
            .AddPolicy(Administration, policy => policy
                .RequireAuthenticatedUser()
                .RequireClaim(SoftSupportClaims.RoleName, RoleNames.Administrateur))
            .AddPolicy(Redaction, policy => policy
                .RequireAuthenticatedUser()
                .RequireClaim(SoftSupportClaims.RoleName, RoleNames.Redacteurs))
            .AddPolicy(Commercial, policy => policy
                .RequireAuthenticatedUser()
                .RequireClaim(SoftSupportClaims.RoleName, RoleNames.Commerciaux))
            .AddPolicy(CatalogLookup, policy => policy
                .RequireAuthenticatedUser()
                .RequireClaim(SoftSupportClaims.RoleName, [RoleNames.Administrateur, .. RoleNames.Commerciaux]));
        return services;
    }
}
