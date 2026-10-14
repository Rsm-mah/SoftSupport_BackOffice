namespace SoftSupport.Application;

/// <summary>Paramètres applicatifs (section <c>SoftSupport</c> de la configuration).</summary>
public sealed class SoftSupportOptions
{
    public const string SectionName = "SoftSupport";

    /// <summary>Mot de passe attribué à un compte du back-office créé par l'administrateur.</summary>
    public string DefaultPassword { get; set; } = "123";

    /// <summary>Adresse du portail client, rappelée dans l'e-mail d'identifiants.</summary>
    public string CustomerPortalUrl { get; set; } = "https://softwell.cloud/SoftBdc";

    /// <summary>Envoi quotidien des alertes d'échéance de contrat aux clients.</summary>
    public bool ContractAlertsEnabled { get; set; } = true;
}
