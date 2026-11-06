using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IArticleRepository
{
    Task<Article?> FindAsync(int articleId, CancellationToken cancellationToken);

    Task<string?> GetLastCodeAsync(string prefix, CancellationToken cancellationToken);

    Task<string?> GetCategoryCodeOfProductAsync(int? productId, CancellationToken cancellationToken);

    Task<(string? ProductName, string? VersionName)> GetDesignationPartsAsync(
        int? productId,
        int? versionId,
        CancellationToken cancellationToken);

    Task<(string? ProductCode, string? VersionCode)> GetCrmCodesAsync(
        int? productId,
        int? versionId,
        CancellationToken cancellationToken);

    Task<HashSet<int>> GetImportedCaseIdsAsync(CancellationToken cancellationToken);

    Task<CrmImportLookups> GetCrmImportLookupsAsync(CancellationToken cancellationToken);

    Task<string?> GetAuthorEmailAsync(string? userId, CancellationToken cancellationToken);

    Task AddAsync(Article article, CancellationToken cancellationToken);

    void AddUpdateLog(ArticleUpdateLog log);

    void Remove(Article article);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}