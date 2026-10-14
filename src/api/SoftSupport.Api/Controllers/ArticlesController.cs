using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Api.Security;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

[Route("api/softsupport/articles")]
public sealed class ArticlesController(
    IArticleQueryService queries,
    IArticleAuthoringService authoring) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ArticleListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<ArticleListItemDto>>>> Search(
        [FromQuery] ArticlesQuery query,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<PagedResult<ArticleListItemDto>>.Ok(await queries.SearchAsync(query, cancellationToken)));

    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<ArticleStatsDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ArticleStatsDto>>> GetStats(CancellationToken cancellationToken) =>
        Ok(ApiResponse<ArticleStatsDto>.Ok(await queries.GetStatsAsync(cancellationToken)));

    [HttpGet("recent")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ArticleListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ArticleListItemDto>>>> GetRecent(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ArticleListItemDto>>.Ok(await queries.GetRecentAsync(cancellationToken)));

    [HttpGet("references")]
    [ProducesResponseType(typeof(ApiResponse<ArticleReferencesDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ArticleReferencesDto>>> GetReferences(CancellationToken cancellationToken) =>
        Ok(ApiResponse<ArticleReferencesDto>.Ok(await queries.GetReferencesAsync(cancellationToken)));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ArticleDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ArticleDetailDto>>> Open(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ArticleDetailDto>.Ok(await queries.OpenAsync(id, cancellationToken)));

    [HttpGet("mine")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Redaction)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MyArticleDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MyArticleDto>>>> GetMine(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<MyArticleDto>>.Ok(await authoring.GetMineAsync(cancellationToken)));

    [HttpGet("refused")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Redaction)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RefusedArticleDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RefusedArticleDto>>>> GetRefused(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<RefusedArticleDto>>.Ok(await authoring.GetMyRefusedAsync(cancellationToken)));

    [HttpGet("{id:int}/edit")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Redaction)]
    [ProducesResponseType(typeof(ApiResponse<EditableArticleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<EditableArticleDto>>> GetEditable(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<EditableArticleDto>.Ok(await authoring.GetEditableAsync(id, cancellationToken)));

    [HttpPost]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Redaction)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Create(
        [FromBody] SaveArticleRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await authoring.CreateAsync(request, cancellationToken)));

    [HttpPut("{id:int}")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Redaction)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(
        int id,
        [FromBody] SaveArticleRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await authoring.UpdateAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Redaction)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await authoring.DeleteAsync(id, cancellationToken)));

    [HttpPut("{id:int}/options")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> ChangeOptions(
        int id,
        [FromBody] ArticleOptionsRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await authoring.ChangeOptionsAsync(id, request, cancellationToken)));

    [HttpPost("{id:int}/revalidate")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> SendBackToValidation(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await authoring.SendBackToValidationAsync(id, cancellationToken)));

    [HttpGet("export")]
    [Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
    [Produces("text/csv", "application/json")]
    public async Task<IActionResult> Export([FromQuery] ArticleExportQuery query, CancellationToken cancellationToken)
    {
        var file = await authoring.ExportAsync(query, cancellationToken);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
