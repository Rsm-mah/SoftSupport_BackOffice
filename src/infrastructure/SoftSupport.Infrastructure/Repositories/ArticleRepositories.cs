using Microsoft.EntityFrameworkCore;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;
using SoftSupport.Infrastructure.Persistence;

namespace SoftSupport.Infrastructure.Repositories;

public sealed class ArticleRepository(SoftSupportDbContext db) : IArticleRepository
{
    public Task<Article?> FindAsync(int articleId, CancellationToken cancellationToken) =>
        db.Articles.FirstOrDefaultAsync(article => article.Id == articleId, cancellationToken);

    public Task<string?> GetLastCodeAsync(string prefix, CancellationToken cancellationToken) =>
        db.Articles.AsNoTracking()
            .Where(article => article.Code != null && article.Code.StartsWith(prefix))
            .MaxAsync(article => article.Code, cancellationToken);

    public async Task<string?> GetCategoryCodeOfProductAsync(int? productId, CancellationToken cancellationToken) =>
        productId is null
            ? null
            : await (from product in db.Products.AsNoTracking()
                     join category in db.Categories.AsNoTracking() on product.CategoryId equals category.Id
                     where product.Id == productId
                     select category.Code)
                .FirstOrDefaultAsync(cancellationToken);

    public async Task<(string? ProductName, string? VersionName)> GetDesignationPartsAsync(
        int? productId,
        int? versionId,
        CancellationToken cancellationToken)
    {
        var productName = productId is null
            ? null
            : await db.Products.AsNoTracking().Where(product => product.Id == productId).Select(product => product.Name).FirstOrDefaultAsync(cancellationToken);
        var versionName = versionId is null
            ? null
            : await db.Versions.AsNoTracking().Where(version => version.Id == versionId).Select(version => version.Name).FirstOrDefaultAsync(cancellationToken);
        return (productName, versionName);
    }

    public async Task<(string? ProductCode, string? VersionCode)> GetCrmCodesAsync(
        int? productId,
        int? versionId,
        CancellationToken cancellationToken)
    {
        var productCode = productId is null
            ? null
            : await db.Products.AsNoTracking().Where(product => product.Id == productId).Select(product => product.CrmCode).FirstOrDefaultAsync(cancellationToken);
        var versionCode = versionId is null
            ? null
            : await db.Versions.AsNoTracking().Where(version => version.Id == versionId).Select(version => version.CrmCode).FirstOrDefaultAsync(cancellationToken);
        return (productCode?.ToString(), string.IsNullOrWhiteSpace(versionCode) ? null : versionCode);
    }

    public async Task<HashSet<int>> GetImportedCaseIdsAsync(CancellationToken cancellationToken) =>
        (await db.Articles.AsNoTracking()
            .Where(article => article.TicketId != null)
            .Select(article => article.TicketId!.Value)
            .ToListAsync(cancellationToken))
        .ToHashSet();

    public async Task<CrmImportLookups> GetCrmImportLookupsAsync(CancellationToken cancellationToken)
    {
        var products = await (from product in db.Products.AsNoTracking()
                              where product.CrmCode != null
                              join category in db.Categories.AsNoTracking() on product.CategoryId equals category.Id into categories
                              from category in categories.DefaultIfEmpty()
                              select new { product.Id, product.CrmCode, CategoryCode = category != null ? category.Code : null })
            .ToListAsync(cancellationToken);
        var versions = await db.Versions.AsNoTracking().Select(version => new { version.Id, version.Name }).ToListAsync(cancellationToken);
        var users = await db.Users.AsNoTracking().Select(user => new { user.Id, user.Email }).ToListAsync(cancellationToken);

        return new CrmImportLookups(
            products
                .GroupBy(product => product.CrmCode!.Value.ToString())
                .ToDictionary(group => group.Key, group => (group.First().Id, (string?)group.First().CategoryCode)),
            versions
                .GroupBy(version => version.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First().Id, StringComparer.OrdinalIgnoreCase),
            users
                .Where(user => !string.IsNullOrWhiteSpace(user.Email))
                .GroupBy(user => user.Email.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First().Id, StringComparer.OrdinalIgnoreCase));
    }

    public async Task<string?> GetAuthorEmailAsync(string? userId, CancellationToken cancellationToken) =>
        userId is null
            ? null
            : await db.Users.AsNoTracking().Where(user => user.Id == userId).Select(user => user.Email).FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(Article article, CancellationToken cancellationToken) => await db.Articles.AddAsync(article, cancellationToken);

    public void AddUpdateLog(ArticleUpdateLog log) => db.ArticleUpdateLogs.Add(log);

    public void Remove(Article article) => db.Articles.Remove(article);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}

public sealed class ArticleReadRepository(SoftSupportDbContext db) : IArticleReadRepository
{
    private IQueryable<Article> Published => db.Articles.AsNoTracking().Where(article => article.IsEnabled);

    public async Task<PagedResult<ArticleListItemDto>> SearchAsync(ArticlesQuery query, CancellationToken cancellationToken)
    {
        var rows = Published;
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            rows = rows.Where(article =>
                (article.Code != null && article.Code.Contains(term))
                || article.Title.Contains(term)
                || article.Designation.Contains(term));
        }

        if (query.ProductId is { } productId)
        {
            rows = rows.Where(article => article.ProductId == productId);
        }

        if (query.VersionId is { } versionId)
        {
            rows = rows.Where(article => article.VersionId == versionId);
        }

        if (query.ThemeId is { } themeId)
        {
            rows = rows.Where(article => article.ThemeId == themeId);
        }

        if (!string.IsNullOrEmpty(query.Option))
        {
            var option = query.Option;
            rows = rows.Where(article => article.Options != null && article.Options.Contains(option));
        }

        var totalCount = await rows.CountAsync(cancellationToken);
        var items = await ToListItems(rows
                .OrderByDescending(article => article.CreatedAt)
                .ThenByDescending(article => article.Id)
                .Skip(query.Skip)
                .Take(query.SafePageSize))
            .ToListAsync(cancellationToken);

        return new PagedResult<ArticleListItemDto>
        {
            Items = items.Select(WithCategory).ToList(),
            TotalCount = totalCount,
            Page = query.SafePage,
            PageSize = query.SafePageSize,
        };
    }

    public async Task<ArticleStatsDto> GetStatsAsync(CancellationToken cancellationToken)
    {
        var stats = await Published
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Total = group.Count(),
                Validated = group.Count(article => article.IsValidated),
                Client = group.Count(article => article.IsValidated && article.Options != null && article.Options.Contains(ArticleOptions.Client)),
            })
            .FirstOrDefaultAsync(cancellationToken);

        return stats is null
            ? new ArticleStatsDto(0, 0, 0, 0)
            : new ArticleStatsDto(stats.Total, stats.Validated, stats.Total - stats.Validated, stats.Client);
    }

    public async Task<IReadOnlyList<ArticleListItemDto>> GetRecentAsync(int take, CancellationToken cancellationToken) =>
        (await ToListItems(Published
                .OrderByDescending(article => article.CreatedAt)
                .ThenByDescending(article => article.Id)
                .Take(take))
            .ToListAsync(cancellationToken))
        .Select(WithCategory)
        .ToList();

    public async Task<(ArticleDetailDto Article, int? CrmAssignedUser)?> GetDetailAsync(int articleId, CancellationToken cancellationToken)
    {
        var row = await db.Articles.AsNoTracking()
            .Where(article => article.Id == articleId)
            .Select(article => new
            {
                article.Id,
                article.Code,
                article.Title,
                article.Designation,
                article.Problem,
                article.Solution,
                article.IsValidated,
                article.IsEnabled,
                article.InCrm,
                article.ViewNumber,
                article.CreatedAt,
                LastUpdate = db.ArticleUpdateLogs.Where(log => log.ArticleId == article.Id).Max(log => (DateTime?)log.UpdateDate),
                ProductName = db.Products.Where(product => product.Id == article.ProductId).Select(product => product.Name).FirstOrDefault(),
                VersionName = db.Versions.Where(version => version.Id == article.VersionId).Select(version => version.Name).FirstOrDefault(),
                ThemeName = db.Themes.Where(theme => theme.Id == article.ThemeId).Select(theme => theme.Name).FirstOrDefault(),
                AuthorFirstName = article.Author != null ? article.Author.FirstName : null,
                AuthorLastName = article.Author != null ? article.Author.LastName : null,
                article.Options,
                article.TicketNumber,
                article.RequestNumber,
                article.CrmAssignedUser,
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            return null;
        }

        var detail = new ArticleDetailDto(
            row.Id,
            row.Code,
            row.Title,
            row.Designation,
            row.Problem,
            row.Solution,
            row.IsValidated,
            row.IsEnabled,
            row.InCrm,
            row.ViewNumber,
            row.CreatedAt,
            row.LastUpdate,
            row.ProductName,
            row.VersionName,
            row.ThemeName,
            CategoryOf(row.Code),
            FullName(row.AuthorFirstName, row.AuthorLastName),
            row.Options,
            row.TicketNumber,
            row.RequestNumber);
        return (detail, row.CrmAssignedUser);
    }

    public async Task<IReadOnlyList<MyArticleDto>> GetByAuthorAsync(string userId, CancellationToken cancellationToken) =>
        await Published
            .Where(article => article.UserId == userId)
            .OrderByDescending(article => article.CreatedAt)
            .Select(article => new MyArticleDto(
                article.Id,
                article.Code,
                article.Title,
                db.Products.Where(product => product.Id == article.ProductId).Select(product => product.Name).FirstOrDefault(),
                article.IsValidated,
                article.ViewNumber,
                article.CreatedAt,
                article.TicketNumber,
                article.RequestNumber))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<RefusedArticleDto>> GetRefusedByAuthorAsync(string userId, CancellationToken cancellationToken) =>
        await db.Articles.AsNoTracking()
            .Where(article => !article.IsEnabled && article.UserId == userId)
            .OrderByDescending(article => article.CreatedAt)
            .Select(article => new RefusedArticleDto(
                article.Id,
                article.Code,
                article.Title,
                db.Products.Where(product => product.Id == article.ProductId).Select(product => product.Name).FirstOrDefault(),
                article.ViewNumber,
                article.CreatedAt,
                article.Comment))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PendingArticleDto>> GetPendingAsync(
        IReadOnlyCollection<int> departementIds,
        CancellationToken cancellationToken)
    {
        var rows = await Pending(departementIds)
            .OrderByDescending(article => article.CreatedAt)
            .Select(article => new
            {
                article.Id,
                article.Code,
                article.Title,
                ProductName = db.Products.Where(product => product.Id == article.ProductId).Select(product => product.Name).FirstOrDefault(),
                article.Author!.FirstName,
                article.Author.LastName,
                article.ViewNumber,
                article.CreatedAt,
                article.TicketNumber,
                article.RequestNumber,
                article.InCrm,
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new PendingArticleDto(
                row.Id,
                row.Code,
                row.Title,
                row.ProductName,
                FullName(row.FirstName, row.LastName),
                row.ViewNumber,
                row.CreatedAt,
                row.TicketNumber,
                row.RequestNumber,
                row.InCrm))
            .ToList();
    }

    public Task<int> CountPendingAsync(IReadOnlyCollection<int> departementIds, CancellationToken cancellationToken) =>
        Pending(departementIds).CountAsync(cancellationToken);

    public async Task<EditableArticleRow?> GetEditableAsync(int articleId, CancellationToken cancellationToken)
    {
        var row = await db.Articles.AsNoTracking()
            .Where(article => article.Id == articleId)
            .Select(article => new
            {
                article.Id,
                article.Code,
                article.Title,
                article.Problem,
                article.Solution,
                article.ProductId,
                article.VersionId,
                article.ThemeId,
                article.TicketNumber,
                article.RequestNumber,
                article.Options,
                article.Comment,
                article.IsValidated,
                article.IsEnabled,
                article.UserId,
                AuthorFirstName = article.Author != null ? article.Author.FirstName : null,
                AuthorLastName = article.Author != null ? article.Author.LastName : null,
                AuthorDepartementId = article.Author != null ? (int?)article.Author.DepartementId : null,
            })
            .FirstOrDefaultAsync(cancellationToken);

        return row is null
            ? null
            : new EditableArticleRow(
                new EditableArticleDto(
                    row.Id,
                    row.Code,
                    row.Title,
                    row.Problem,
                    row.Solution,
                    row.ProductId,
                    row.VersionId,
                    row.ThemeId,
                    row.TicketNumber,
                    row.RequestNumber,
                    row.Options,
                    row.Comment,
                    row.IsValidated,
                    row.IsEnabled,
                    FullName(row.AuthorFirstName, row.AuthorLastName)),
                row.UserId,
                row.AuthorDepartementId);
    }

    public async Task<ArticleReferencesDto> GetReferencesAsync(CancellationToken cancellationToken)
    {
        var products = await (from product in db.Products.AsNoTracking().Where(ProductCatalog.Listed)
                              join category in db.Categories.AsNoTracking() on product.CategoryId equals category.Id into categories
                              from category in categories.DefaultIfEmpty()
                              orderby product.Name
                              select new ProductLookupDto(product.Id, product.Name, category != null ? category.Code : null))
            .ToListAsync(cancellationToken);
        var versions = await db.Versions.AsNoTracking()
            .OrderBy(version => version.Name)
            .Select(version => new LookupDto(version.Id, version.Name))
            .ToListAsync(cancellationToken);
        var themes = await db.Themes.AsNoTracking()
            .OrderBy(theme => theme.Name)
            .Select(theme => new LookupDto(theme.Id, theme.Name))
            .ToListAsync(cancellationToken);
        return new ArticleReferencesDto(products, versions, themes);
    }

    public async Task<IReadOnlyList<ArticleExportRow>> GetExportRowsAsync(
        DateTime from,
        DateTime toExclusive,
        int departementId,
        CancellationToken cancellationToken) =>
        await db.Articles.AsNoTracking()
            .Where(article => article.CreatedAt >= from
                && article.CreatedAt < toExclusive
                && article.Author != null
                && article.Author.DepartementId == departementId)
            .OrderByDescending(article => article.CreatedAt)
            .Select(article => new ArticleExportRow(
                article.Code,
                article.TicketNumber,
                article.RequestNumber,
                article.Designation,
                article.CreatedAt,
                article.IsValidated,
                article.Author!.FirstName))
            .ToListAsync(cancellationToken);

    private IQueryable<Article> Pending(IReadOnlyCollection<int> departementIds) =>
        Published.Where(article => !article.IsValidated
            && article.Author != null
            && departementIds.Contains(article.Author.DepartementId));

    private IQueryable<ArticleListItemDto> ToListItems(IQueryable<Article> rows) =>
        rows.Select(article => new ArticleListItemDto(
            article.Id,
            article.Code,
            article.Title,
            article.Designation,
            db.Products.Where(product => product.Id == article.ProductId).Select(product => product.Name).FirstOrDefault(),
            null,
            article.IsValidated,
            article.Options,
            article.ViewNumber,
            article.CreatedAt));

    private static ArticleListItemDto WithCategory(ArticleListItemDto item) => item with { CategoryCode = CategoryOf(item.Code) };

    /// <summary>Le code de catégorie est le préfixe de l'identifiant (« SAGCPT|00000042 »).</summary>
    private static string? CategoryOf(string? code)
    {
        var index = code?.IndexOf(ArticleCode.Separator, StringComparison.Ordinal) ?? -1;
        return index > 0 ? code![..index] : null;
    }

    private static string? FullName(string? firstName, string? lastName)
    {
        var name = $"{firstName} {lastName}".Trim();
        return name.Length == 0 ? null : name;
    }
}
