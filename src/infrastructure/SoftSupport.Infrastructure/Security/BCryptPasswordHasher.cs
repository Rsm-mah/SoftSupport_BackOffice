using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using SoftSupport.Application.Abstractions;

namespace SoftSupport.Infrastructure.Security;

public sealed class PasswordOptions
{
    public const string SectionName = "Security";

    public bool HashPasswords { get; set; }
}

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
