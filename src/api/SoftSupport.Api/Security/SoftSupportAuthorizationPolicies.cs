using SoftSupport.Domain.Rules;
using SoftSupport.Infrastructure.Security;

namespace SoftSupport.Api.Security;

/// <summary>
/// Politiques d'accès, fondées sur la claim <c>role_name</c> du jeton. La validation des articles
/// dépend des départements confiés à l'utilisateur : elle est contrôlée par le service, en base.
/// </summary>
public static class SoftSupportAuthorizationPolicies
{
    /// <summary>Catalogue, utilisateurs, diffusion et extraction : Administrateur.</summary>
    public const string Administration = "SoftSupport.Administration";

    /// <summary>« Mes articles » et « Non validés » : Administrateur et Ecriture.</summary>
    public const string Redaction = "SoftSupport.Redaction";

    /// <summary>Clients, contrats et historique : Commercial et Responsable Commercial.</summary>
    public const string Commercial = "SoftSupport.Commercial";

    /// <summary>Liste des produits pour les packs et les contrats.</summary>
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
