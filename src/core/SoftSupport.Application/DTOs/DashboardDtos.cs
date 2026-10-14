using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.DTOs.Dashboard;

// ---- Bloc « Articles » (Administrateur) -------------------------------------------------------

/// <summary>Article du classement, avec ses vues et les votes des clients.</summary>
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

/// <summary>Ligne lue en base, avant application des règles de classement.</summary>
public sealed record ArticleVoteStats(
    int ArticleId,
    string? Code,
    string Title,
    string? ProductName,
    int ViewNumber,
    int Likes,
    int Dislikes);

// ---- Bloc « Clients » (Commercial, Responsable Commercial) --------------------------------------

/// <summary>Contrat qui arrive à échéance ; <c>Renewed</c> : une période suivante existe déjà pour ce produit.</summary>
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

/// <summary>Ligne de contrat lue en base pour la période demandée.</summary>
public sealed record ContractEndingRow(
    int ContractId,
    int CompanyId,
    string CompanyName,
    string? ProductName,
    DateTime StartDate,
    DateTime EndDate,
    bool Renewed);

/// <summary>Société et nombre de comptes clients, lus en base.</summary>
public sealed record CompanyAccountsRow(int CompanyId, string CompanyName, string ShortName, int UserNumber, int AccountCount);
