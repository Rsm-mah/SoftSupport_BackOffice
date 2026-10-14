using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.DTOs.Dashboard;

public sealed record TopArticleDto(
    int ArticleId,
    string? Code,
    string Title,
    string? ProductName,
    int ViewNumber,
    int Likes,
    int Dislikes,
    int? SatisfactionPercent);

public sealed record ArticleDashboardDto(
    int PublishedArticles,
    int TotalViews,
    int TotalLikes,
    int TotalDislikes,
    int PoorlyRatedCount,
    IReadOnlyList<TopArticleDto> MostRead,
    IReadOnlyList<TopArticleDto> WorstRated);

public sealed record ArticleVoteStats(
    int ArticleId,
    string? Code,
    string Title,
    string? ProductName,
    int ViewNumber,
    int Likes,
    int Dislikes);

public sealed record ExpiringContractItemDto(
    int ContractId,
    int CompanyId,
    string CompanyName,
    string? ProductName,
    DateTime StartDate,
    DateTime EndDate,
    int DaysLeft,
    bool Renewed);

public sealed record CompanyQuotaDto(
    int CompanyId,
    string CompanyName,
    string ShortName,
    int UserNumber,
    int AccountCount,
    QuotaStatus Status);

public sealed record CustomerDashboardDto(
    DateTime MonthStart,
    DateTime MonthEnd,
    IReadOnlyList<ExpiringContractItemDto> ExpiringThisMonth,
    int ToRenewCount,
    IReadOnlyList<CompanyQuotaDto> Quotas,
    int FullCount,
    int ExceededCount);

public sealed record ContractEndingRow(
    int ContractId,
    int CompanyId,
    string CompanyName,
    string? ProductName,
    DateTime StartDate,
    DateTime EndDate,
    bool Renewed);

public sealed record CompanyAccountsRow(int CompanyId, string CompanyName, string ShortName, int UserNumber, int AccountCount);
