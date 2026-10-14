namespace SoftSupport.Domain.Rules;

/// <summary>
/// Noms des rôles de la table <c>Roles</c>, portés par la claim <c>role_name</c>. Le droit de
/// valider ne dépend pas du rôle mais des départements confiés à l'utilisateur
/// (<see cref="ValidatorDepartements"/>).
/// </summary>
public static class RoleNames
{
    public const string Administrateur = "Administrateur";
    public const string Commercial = "Commercial";
    public const string Ecriture = "Ecriture";
    public const string Lecture = "Lecture";
    public const string NonAssigne = "Non Assigné";
    public const string ResponsableCommercial = "Responsable Commercial";

    /// <summary>Rédaction d'articles : « Mes articles » et « Non validés ».</summary>
    public static readonly IReadOnlyList<string> Redacteurs = [Administrateur, Ecriture];

    /// <summary>Gestion des clients, de leurs contrats et de l'historique.</summary>
    public static readonly IReadOnlyList<string> Commerciaux = [Commercial, ResponsableCommercial];
}
