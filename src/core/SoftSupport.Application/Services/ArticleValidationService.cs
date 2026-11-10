using Microsoft.Extensions.Logging;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.Interfaces.Repositories;
using SoftSupport.Application.Interfaces.Services;
using SoftSupport.Application.Mail;
using SoftSupport.Domain;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

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