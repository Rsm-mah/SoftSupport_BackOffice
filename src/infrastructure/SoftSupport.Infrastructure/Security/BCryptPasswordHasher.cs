using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using SoftSupport.Application.Abstractions;

namespace SoftSupport.Infrastructure.Security;

/// <summary>Stockage des mots de passe du back-office (section <c>Security</c>).</summary>
public sealed class PasswordOptions
{
    public const string SectionName = "Security";

    /// <summary>
    /// Faux (par défaut) : les mots de passe restent enregistrés en clair, comme dans BDC, pour que
    /// l'ancien back-office continue de fonctionner. Vrai : tout nouveau mot de passe est haché
    /// (BCrypt) et chaque mot de passe en clair l'est à la connexion suivante.
    /// </summary>
    public bool HashPasswords { get; set; }
}

/// <summary>
/// Accepte les mots de passe BCrypt et, pour compatibilité, les mots de passe BDC en clair
/// (comparaison à temps constant).
/// </summary>
public sealed class BCryptPasswordHasher(IOptions<PasswordOptions> options) : IPasswordHasher
{
    public string Hash(string password) =>
        options.Value.HashPasswords ? BCrypt.Net.BCrypt.HashPassword(password) : password;

    public bool Verify(string password, string? stored)
    {
        if (string.IsNullOrEmpty(stored))
        {
            return false;
        }

        if (IsBCrypt(stored))
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, stored);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return false;
            }
        }

        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(password), Encoding.UTF8.GetBytes(stored));
    }

    public bool NeedsUpgrade(string? stored) => options.Value.HashPasswords && !string.IsNullOrEmpty(stored) && !IsBCrypt(stored);

    private static bool IsBCrypt(string stored) =>
        stored.Length == 60 && stored.StartsWith("$2", StringComparison.Ordinal);
}
