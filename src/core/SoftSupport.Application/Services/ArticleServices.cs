using System.Globalization;
using System.Text;
using Microsoft.Extensions.Logging;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.Interfaces;
using SoftSupport.Application.Mail;
using SoftSupport.Domain;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

internal static class ArticleContentBuilder
{
    public static async Task<ArticleContent> BuildAsync(
        IArticleRepository articles,
        string title,
        string problem,
        string solution,
        int? productId,
        int? versionId,
        int? themeId,
        string? ticketNumber,
        string? requestNumber,
        CancellationToken cancellationToken)
    {
        var (productName, versionName) = await articles.GetDesignationPartsAsync(productId, versionId, cancellationToken);
        return new ArticleContent(
            title.Trim(),
            problem,
            solution,
            ArticleCode.Designation(productName, versionName, title),
            productId,
            versionId,
            themeId,
            Clean(ticketNumber),
            Clean(requestNumber));
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class ArticleQueryService(
    IArticleReadRepository reads,
    IArticleRepository articles,
    ICrmGateway crm,
    ILogger<ArticleQueryService> logger) : IArticleQueryService
{
    private const int RecentCount = 20;

    public Task<PagedResult<ArticleListItemDto>> SearchAsync(ArticlesQuery query, CancellationToken cancellationToken) =>
        reads.SearchAsync(query, cancellationToken);

    public Task<ArticleStatsDto> GetStatsAsync(CancellationToken cancellationToken) => reads.GetStatsAsync(cancellationToken);

    public Task<IReadOnlyList<ArticleListItemDto>> GetRecentAsync(CancellationToken cancellationToken) =>
        reads.GetRecentAsync(RecentCount, cancellationToken);

    public async Task<ArticleDetailDto> OpenAsync(int articleId, CancellationToken cancellationToken)
    {
        var article = await articles.FindAsync(articleId, cancellationToken)
            ?? throw new KeyNotFoundException("Article introuvable.");
        article.RegisterView();
        await articles.SaveChangesAsync(cancellationToken);

        var (detail, crmAssignedUser) = await reads.GetDetailAsync(articleId, cancellationToken)
            ?? throw new KeyNotFoundException("Article introuvable.");

        // Un article importé est attribué à l'intervenant du cas CRM d'origine.
        if (detail.InCrm && crmAssignedUser is { } crmUserId)
        {
            try
            {
                var crmName = await crm.GetUserFirstNameAsync(crmUserId, cancellationToken);
                if (!string.IsNullOrWhiteSpace(crmName))
                {
                    detail = detail with { AuthorName = crmName };
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogWarning(exception, "CRM indisponible : auteur de l'article {ArticleId} non résolu", articleId);
            }
        }

        return detail;
    }

    public Task<ArticleReferencesDto> GetReferencesAsync(CancellationToken cancellationToken) =>
        reads.GetReferencesAsync(cancellationToken);
}

public sealed class ArticleAuthoringService(
    IArticleRepository articles,
    IArticleReadRepository reads,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<ArticleAuthoringService> logger) : IArticleAuthoringService
{
    public Task<IReadOnlyList<MyArticleDto>> GetMineAsync(CancellationToken cancellationToken) =>
        reads.GetByAuthorAsync(currentUser.UserId, cancellationToken);

    public Task<IReadOnlyList<RefusedArticleDto>> GetMyRefusedAsync(CancellationToken cancellationToken) =>
        reads.GetRefusedByAuthorAsync(currentUser.UserId, cancellationToken);

    public async Task<EditableArticleDto> GetEditableAsync(int articleId, CancellationToken cancellationToken)
    {
        var row = await reads.GetEditableAsync(articleId, cancellationToken)
            ?? throw new KeyNotFoundException("Article introuvable.");
        EnsureAuthorOrAdmin(row.AuthorId);
        return row.Article;
    }

    public async Task<string> CreateAsync(SaveArticleRequest request, CancellationToken cancellationToken)
    {
        var content = await BuildAsync(request, cancellationToken);
        var prefix = ArticleCode.PrefixFor(await articles.GetCategoryCodeOfProductAsync(request.ProductId, cancellationToken));
        var code = ArticleCode.Next(prefix, await articles.GetLastCodeAsync(prefix, cancellationToken));
        var now = clock.GetLocalNow().DateTime;

        var article = Article.Create(code, content, currentUser.UserId, now);
        await articles.AddAsync(article, cancellationToken);
        await articles.SaveChangesAsync(cancellationToken);

        articles.AddUpdateLog(ArticleUpdateLog.For(article, now));
        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Article {ArticleId} ({Code}) créé", article.Id, code);
        return $"L'article {code} a été créé : il est en attente de validation.";
    }

    public async Task<string> UpdateAsync(int articleId, SaveArticleRequest request, CancellationToken cancellationToken)
    {
        var article = await RequireAsync(articleId, cancellationToken);
        EnsureAuthorOrAdmin(article.UserId);
        var wasRefused = !article.IsEnabled;

        article.UpdateByAuthor(await BuildAsync(request, cancellationToken));
        articles.AddUpdateLog(ArticleUpdateLog.For(article, clock.GetLocalNow().DateTime));
        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Article {ArticleId} modifié par son rédacteur", articleId);
        return wasRefused
            ? "L'article a été corrigé et soumis à nouveau à la validation."
            : "L'article a été modifié.";
    }

    public async Task<string> DeleteAsync(int articleId, CancellationToken cancellationToken)
    {
        var article = await RequireAsync(articleId, cancellationToken);
        EnsureAuthorOrAdmin(article.UserId);
        articles.Remove(article);
        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Article {ArticleId} supprimé par son rédacteur", articleId);
        return "L'article a été supprimé.";
    }

    public async Task<string> ChangeOptionsAsync(int articleId, ArticleOptionsRequest request, CancellationToken cancellationToken)
    {
        var article = await RequireAsync(articleId, cancellationToken);
        if (!article.IsValidated)
        {
            throw new SoftSupportDomainException("La diffusion ne se règle que sur un article validé.");
        }

        article.ChangeOptions(ArticleOptions.From(request.Interne, request.Client));
        await articles.SaveChangesAsync(cancellationToken);
        return "La diffusion de l'article a été mise à jour.";
    }

    public async Task<string> SendBackToValidationAsync(int articleId, CancellationToken cancellationToken)
    {
        var article = await RequireAsync(articleId, cancellationToken);
        article.SendBackToValidation();
        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Article {ArticleId} renvoyé en validation", articleId);
        return "L'article a été renvoyé en validation.";
    }

    public async Task<ExportFile> ExportAsync(ArticleExportQuery query, CancellationToken cancellationToken)
    {
        if (query.To.Date < query.From.Date)
        {
            throw new SoftSupportDomainException("La date de fin doit suivre la date de début.");
        }

        var rows = await reads.GetExportRowsAsync(query.From.Date, query.To.Date.AddDays(1), query.DepartementId, cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("Code;No.Ticket;No.Demande;Designation;Date de creation;Statut;Createur");
        foreach (var row in rows)
        {
            csv.AppendJoin(';',
                Cell(row.Code),
                Cell(row.TicketNumber),
                Cell(row.RequestNumber),
                Cell(row.Designation),
                Cell(row.CreatedAt.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture)),
                Cell(row.IsValidated ? "valide" : "non valide"),
                Cell(row.Author));
            csv.AppendLine();
        }

        var content = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
        return new ExportFile($"articles_{clock.GetLocalNow():yyyyMMdd}.csv", "text/csv", content);
    }

    private static string Cell(string? value)
    {
        var text = (value ?? string.Empty).Replace("\r", " ").Replace("\n", " ");
        return text.IndexOfAny([';', '"']) >= 0 ? $"\"{text.Replace("\"", "\"\"")}\"" : text;
    }

    private Task<ArticleContent> BuildAsync(SaveArticleRequest request, CancellationToken cancellationToken) =>
        ArticleContentBuilder.BuildAsync(
            articles,
            request.Title,
            request.Problem,
            request.Solution,
            request.ProductId,
            request.VersionId,
            request.ThemeId,
            request.TicketNumber,
            request.RequestNumber,
            cancellationToken);

    private async Task<Article> RequireAsync(int articleId, CancellationToken cancellationToken) =>
        await articles.FindAsync(articleId, cancellationToken) ?? throw new KeyNotFoundException("Article introuvable.");

    private void EnsureAuthorOrAdmin(string? authorId)
    {
        if (authorId != currentUser.UserId && currentUser.RoleName != RoleNames.Administrateur)
        {
            throw new UnauthorizedAccessException("Seul le rédacteur de l'article peut le modifier.");
        }
    }
}

public sealed class ArticleValidationService(
    IArticleRepository articles,
    IArticleReadRepository reads,
    IUserRepository users,
    ICrmGateway crm,
    IEmailQueue emailQueue,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<ArticleValidationService> logger) : IArticleValidationService
{
    public async Task<PendingCountDto> CountPendingAsync(CancellationToken cancellationToken)
    {
        var departements = await GetMyDepartementsAsync(cancellationToken);
        return departements.Count == 0
            ? new PendingCountDto(false, 0)
            : new PendingCountDto(true, await reads.CountPendingAsync(departements, cancellationToken));
    }

    public async Task<IReadOnlyList<PendingArticleDto>> GetPendingAsync(CancellationToken cancellationToken) =>
        await reads.GetPendingAsync(await RequireMyDepartementsAsync(cancellationToken), cancellationToken);

    public async Task<EditableArticleDto> GetForValidationAsync(int articleId, CancellationToken cancellationToken)
    {
        var row = await RequireValidatableAsync(articleId, cancellationToken);
        return row.Article;
    }

    public async Task<string> ValidateAsync(int articleId, ValidateArticleRequest request, CancellationToken cancellationToken)
    {
        await RequireValidatableAsync(articleId, cancellationToken);
        var article = await RequireAsync(articleId, cancellationToken);
        var content = await ArticleContentBuilder.BuildAsync(
            articles,
            request.Title,
            request.Problem,
            request.Solution,
            request.ProductId,
            request.VersionId,
            request.ThemeId,
            request.TicketNumber,
            request.RequestNumber,
            cancellationToken);

        var changed = article.DiffersFrom(content);
        article.Validate(changed ? content : null, ArticleOptions.From(request.Interne, request.Client));
        if (changed)
        {
            articles.AddUpdateLog(ArticleUpdateLog.For(article, clock.GetLocalNow().DateTime));
        }

        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Article {ArticleId} validé", articleId);

        if (changed && article.InCrm && article.TicketId is { } caseId)
        {
            await PushToCrmAsync(article, caseId, cancellationToken);
        }

        return $"L'article {article.Code} a été validé.";
    }

    public async Task<string> DenyAsync(int articleId, ArticleCommentRequest request, CancellationToken cancellationToken)
    {
        await RequireValidatableAsync(articleId, cancellationToken);
        var article = await RequireAsync(articleId, cancellationToken);
        article.Deny(request.Comment);
        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Article {ArticleId} refusé", articleId);

        var authorEmail = await articles.GetAuthorEmailAsync(article.UserId, cancellationToken);
        if (!string.IsNullOrWhiteSpace(authorEmail))
        {
            emailQueue.Enqueue(SoftSupportMailTemplates.ArticleRefused(authorEmail, article.Code, article.Title, request.Comment));
        }

        return "L'article a été refusé et son rédacteur a été prévenu par e-mail.";
    }

    public async Task<string> RemoveAsync(int articleId, ArticleCommentRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Comment))
        {
            throw new SoftSupportDomainException("Le commentaire de suppression est obligatoire.");
        }

        await RequireValidatableAsync(articleId, cancellationToken);
        var article = await RequireAsync(articleId, cancellationToken);
        var authorEmail = await articles.GetAuthorEmailAsync(article.UserId, cancellationToken);
        var (code, title) = (article.Code, article.Title);

        articles.Remove(article);
        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Article {ArticleId} supprimé par un validateur", articleId);

        if (!string.IsNullOrWhiteSpace(authorEmail))
        {
            emailQueue.Enqueue(SoftSupportMailTemplates.ArticleDeleted(authorEmail, code, title, request.Comment));
        }

        return "L'article a été supprimé et son rédacteur a été prévenu par e-mail.";
    }

    public async Task<string> ImportFromCrmAsync(CancellationToken cancellationToken)
    {
        await RequireMyDepartementsAsync(cancellationToken);

        var cases = await crm.GetKnowledgeBaseCasesAsync(cancellationToken);
        var imported = await articles.GetImportedCaseIdsAsync(cancellationToken);
        var pending = cases.Where(item => !imported.Contains(item.Id)).ToList();
        if (pending.Count == 0)
        {
            return "Aucun nouvel article à importer depuis le CRM.";
        }

        var crmEmails = await crm.GetUserEmailsAsync(cancellationToken);
        var lookups = await articles.GetCrmImportLookupsAsync(cancellationToken);
        var lastCodes = new Dictionary<string, string?>(StringComparer.Ordinal);
        var now = clock.GetLocalNow().DateTime;

        foreach (var item in pending)
        {
            (int ProductId, string? CategoryCode)? product =
                item.ProductCode is { } productCode && lookups.ProductsByCrmCode.TryGetValue(productCode.Trim(), out var found)
                    ? found
                    : null;
            int? versionId = item.VersionCode is { } versionName && lookups.VersionsByName.TryGetValue(versionName.Trim(), out var version)
                ? version
                : null;
            string? authorId = item.AssignedUserId is { } crmUserId
                && crmEmails.TryGetValue(crmUserId, out var email)
                && email is not null
                && lookups.UserIdsByEmail.TryGetValue(email.Trim(), out var userId)
                    ? userId
                    : null;

            var prefix = ArticleCode.PrefixFor(product?.CategoryCode);
            if (!lastCodes.TryGetValue(prefix, out var lastCode))
            {
                lastCode = await articles.GetLastCodeAsync(prefix, cancellationToken);
            }

            var code = ArticleCode.Next(prefix, lastCode);
            lastCodes[prefix] = code;

            await articles.AddAsync(
                Article.ImportFromCrm(
                    code,
                    item.Id,
                    item.Title,
                    item.ProblemNote,
                    item.SolutionNote,
                    authorId,
                    item.AssignedUserId,
                    product?.ProductId,
                    versionId,
                    now),
                cancellationToken);
        }

        await articles.SaveChangesAsync(cancellationToken);
        logger.LogInformation("{Count} article(s) importé(s) depuis le CRM", pending.Count);
        return $"{pending.Count} article(s) importé(s) depuis le CRM.";
    }

    private async Task PushToCrmAsync(Article article, int caseId, CancellationToken cancellationToken)
    {
        try
        {
            var (productCode, versionCode) = await articles.GetCrmCodesAsync(article.ProductId, article.VersionId, cancellationToken);
            await crm.UpdateCaseAsync(caseId, article.Title, article.Problem, article.Solution, productCode, versionCode, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            // L'article est validé dans SoftSupport même si le CRM ne répond pas.
            logger.LogError(exception, "Report de l'article {ArticleId} sur le cas CRM {CaseId} impossible", article.Id, caseId);
        }
    }

    private async Task<IReadOnlyList<int>> GetMyDepartementsAsync(CancellationToken cancellationToken)
    {
        var user = await users.FindAsync(currentUser.UserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Utilisateur introuvable.");
        return ValidatorDepartements.Parse(user.Validator);
    }

    private async Task<IReadOnlyList<int>> RequireMyDepartementsAsync(CancellationToken cancellationToken)
    {
        var departements = await GetMyDepartementsAsync(cancellationToken);
        return departements.Count > 0
            ? departements
            : throw new UnauthorizedAccessException("Aucun département ne vous a été confié pour la validation.");
    }

    private async Task<EditableArticleRow> RequireValidatableAsync(int articleId, CancellationToken cancellationToken)
    {
        var departements = await RequireMyDepartementsAsync(cancellationToken);
        var row = await reads.GetEditableAsync(articleId, cancellationToken)
            ?? throw new KeyNotFoundException("Article introuvable.");

        if (row.AuthorDepartementId is not { } departementId || !departements.Contains(departementId))
        {
            throw new UnauthorizedAccessException("Cet article ne relève pas de vos départements de validation.");
        }

        if (row.Article.IsValidated || !row.Article.IsEnabled)
        {
            throw new SoftSupportDomainException("Cet article n'est plus en attente de validation.");
        }

        return row;
    }

    private async Task<Article> RequireAsync(int articleId, CancellationToken cancellationToken) =>
        await articles.FindAsync(articleId, cancellationToken) ?? throw new KeyNotFoundException("Article introuvable.");
}
