using System.Linq.Expressions;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Domain.Rules;

/// <summary>
/// Produits proposés à l'écran. La liste « case_prod1 » du CRM contient aussi des lignes
/// sans objet pour la base de connaissances : seules les plages de codes ci-dessous sont
/// retenues, comme dans l'application BDC d'origine.
/// </summary>
public static class ProductCatalog
{
    private static readonly int[] ExcludedLowCodes = [72, 73, 79, 80, 83, 84, 86, 87];
    private static readonly int[] ExcludedHighCodes = [103, 128];

    public static bool IsListedCode(int? code) =>
        code is { } value
        && ((value > 56 && value < 96 && !ExcludedLowCodes.Contains(value))
            || (value > 101 && !ExcludedHighCodes.Contains(value)));

    /// <summary>Produits CRM retenus (filtre traduit en SQL).</summary>
    public static Expression<Func<Product, bool>> Listed =>
        product => (product.CrmCode > 56 && product.CrmCode < 96
                && product.CrmCode != 72 && product.CrmCode != 73 && product.CrmCode != 79
                && product.CrmCode != 80 && product.CrmCode != 83 && product.CrmCode != 84
                && product.CrmCode != 86 && product.CrmCode != 87)
            || (product.CrmCode > 101 && product.CrmCode != 103 && product.CrmCode != 128);

    /// <summary>Produits CRM retenus et produits créés localement (sans identifiant CRM).</summary>
    public static Expression<Func<Product, bool>> ListedOrLocal =>
        product => (product.CrmCode > 56 && product.CrmCode < 96
                && product.CrmCode != 72 && product.CrmCode != 73 && product.CrmCode != 79
                && product.CrmCode != 80 && product.CrmCode != 83 && product.CrmCode != 84
                && product.CrmCode != 86 && product.CrmCode != 87)
            || (product.CrmCode > 101 && product.CrmCode != 103 && product.CrmCode != 128)
            || product.CrmId == null;

    /// <summary>Famille de la table <c>Custom_Captions</c> qui liste les produits.</summary>
    public const string CrmProductFamily = "case_prod1";

    /// <summary>Famille de la table <c>Custom_Captions</c> qui liste les versions.</summary>
    public const string CrmVersionFamily = "case_version";
}
