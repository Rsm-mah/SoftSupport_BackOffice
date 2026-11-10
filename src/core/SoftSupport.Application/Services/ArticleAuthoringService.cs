using System.Globalization;
using System.Text;
using Microsoft.Extensions.Logging;
using SoftSupport.Application.Abstractions;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.Interfaces.Repositories;
using SoftSupport.Application.Interfaces.Services;
using SoftSupport.Domain;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Services;

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