using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.DTOs.Articles;

public sealed record ArticleListItemDto(
    int ArticleId,
    string? Code,
    string Title,
    string Designation,
    string? ProductName,
    string? CategoryCode,
    bool IsValidated,
    string? Options,
    int ViewNumber,
    DateTime CreatedAt);

public sealed class ArticlesQuery : PagedQuery
{
    public string? Search { get; init; }
    public int? ProductId { get; init; }
    public int? VersionId { get; init; }
    public int? ThemeId { get; init; }
    public string? Option { get; init; }
}

public sealed record ArticleStatsDto(int Total, int Validated, int Pending, int Client);

public sealed record ArticleDetailDto(
    int ArticleId,
    string? Code,
    string Title,
    string Designation,
    string Problem,
    string Solution,
    bool IsValidated,
    bool IsEnabled,
    bool InCrm,
    int ViewNumber,
    DateTime CreatedAt,
    DateTime? LastUpdate,
    string? ProductName,
    string? VersionName,
    string? ThemeName,
    string? CategoryCode,
    string? AuthorName,
    string? Options,
    string? TicketNumber,
    string? RequestNumber);

public sealed record MyArticleDto(
    int ArticleId,
    string? Code,
    string Title,
    string? ProductName,
    bool IsValidated,
    int ViewNumber,
    DateTime CreatedAt,
    string? TicketNumber,
    string? RequestNumber);

public sealed record RefusedArticleDto(
    int ArticleId,
    string? Code,
    string Title,
    string? ProductName,
    int ViewNumber,
    DateTime CreatedAt,
    string? Comment);

public sealed record PendingArticleDto(
    int ArticleId,
    string? Code,
    string Title,
    string? ProductName,
    string? AuthorName,
    int ViewNumber,
    DateTime CreatedAt,
    string? TicketNumber,
    string? RequestNumber,
    bool InCrm);

public sealed record EditableArticleDto(
    int ArticleId,
    string? Code,
    string Title,
    string Problem,
    string Solution,
    int? ProductId,
    int? VersionId,
    int? ThemeId,
    string? TicketNumber,
    string? RequestNumber,
    string? Options,
    string? Comment,
    bool IsValidated,
    bool IsEnabled,
    string? AuthorName);

public sealed record ProductLookupDto(int Id, string Name, string? CategoryCode);

public sealed record ArticleReferencesDto(
    IReadOnlyList<ProductLookupDto> Products,
    IReadOnlyList<LookupDto> Versions,
    IReadOnlyList<LookupDto> Themes);

public sealed record SaveArticleRequest(
    string Title,
    string Problem,
    string Solution,
    int? ProductId,
    int? VersionId,
    int? ThemeId,
    string? TicketNumber,
    string? RequestNumber);

public sealed record ValidateArticleRequest(
    string Title,
    string Problem,
    string Solution,
    int? ProductId,
    int? VersionId,
    int? ThemeId,
    string? TicketNumber,
    string? RequestNumber,
    bool Interne,
    bool Client);

public sealed record ArticleOptionsRequest(bool Interne, bool Client);

public sealed record ArticleCommentRequest(string Comment);

public sealed record PendingCountDto(bool IsValidator, int Count);

public sealed record ArticleExportQuery(DateTime From, DateTime To, int DepartementId);

public sealed record ExportFile(string FileName, string ContentType, byte[] Content);
