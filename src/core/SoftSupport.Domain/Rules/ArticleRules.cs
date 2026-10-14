using System.Globalization;

namespace SoftSupport.Domain.Rules;

// Colonne `option` de BDC : « 1 » = interne, « 1,2 » = interne et clients.
public static class ArticleOptions
{
    public const string Interne = "1";
    public const string Client = "2";

    public static bool IsInterne(string? options) => Parse(options).Contains(Interne);

    public static bool IsClient(string? options) => Parse(options).Contains(Client);

    public static string? Normalize(string? options)
    {
        var values = Parse(options);
        if (values.Contains(Client))
        {
            return $"{Interne},{Client}";
        }

        return values.Contains(Interne) ? Interne : null;
    }

    public static string? From(bool interne, bool client) =>
        Normalize(string.Join(',', new[] { interne ? Interne : null, client ? Client : null }.Where(value => value is not null)));

    private static HashSet<string> Parse(string? options) =>
        (options ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.Ordinal);
}

public static class ArticleCode
{
    public const string DefaultCategory = "KB";
    public const string Separator = "|";
    public const int NumberLength = 8;

    public static string PrefixFor(string? categoryCode) =>
        (string.IsNullOrWhiteSpace(categoryCode) ? DefaultCategory : categoryCode.Trim()).ToUpperInvariant() + Separator;

    public static string Next(string prefix, string? lastCode)
    {
        var last = 0L;
        if (!string.IsNullOrEmpty(lastCode)
            && lastCode.StartsWith(prefix, StringComparison.Ordinal)
            && long.TryParse(lastCode.AsSpan(prefix.Length), NumberStyles.None, CultureInfo.InvariantCulture, out var parsed))
        {
            last = parsed;
        }

        return prefix + (last + 1).ToString(CultureInfo.InvariantCulture).PadLeft(NumberLength, '0');
    }

    public static string Designation(string? productName, string? versionName, string title)
    {
        var head = string.Join(' ', new[] { productName, versionName }.Where(part => !string.IsNullOrWhiteSpace(part)));
        return string.IsNullOrWhiteSpace(head) ? title.Trim() : $"{head} - {title.Trim()}";
    }
}

public static class ValidatorDepartements
{
    public static IReadOnlyList<int> Parse(string? value) =>
        (value ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => int.TryParse(item, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) ? id : 0)
            .Where(id => id > 0)
            .Distinct()
            .ToList();

    public static string Format(IEnumerable<int> departementIds)
    {
        var ids = departementIds.Where(id => id > 0).Distinct().Order().ToList();
        return ids.Count == 0 ? string.Empty : string.Join(',', ids) + ",";
    }
}
