namespace SoftSupport.Domain.Rules;

public static class RoleNames
{
    public const string Administrateur = "Administrateur";
    public const string Commercial = "Commercial";
    public const string Ecriture = "Ecriture";
    public const string Lecture = "Lecture";
    public const string NonAssigne = "Non Assigné";
    public const string ResponsableCommercial = "Responsable Commercial";

    public static readonly IReadOnlyList<string> Redacteurs = [Administrateur, Ecriture];

    public static readonly IReadOnlyList<string> Commerciaux = [Commercial, ResponsableCommercial];
}
