using Microsoft.AspNetCore.Mvc;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

/// <summary>
/// File de validation. L'accès dépend des départements confiés à l'utilisateur
/// (colonne <c>Validator</c>), vérifiés en base par le service à chaque appel.
/// </summary>
[Route("api/softsupport/validation")]
public sealed class ValidationController(IArticleValidationService service) : SoftSupportControllerBase
{
    [HttpGet("count")]
    [ProducesResponseType(typeof(ApiResponse<PendingCountDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PendingCountDto>>> Count(CancellationToken cancellationToken) =>
        Ok(ApiResponse<PendingCountDto>.Ok(await service.CountPendingAsync(cancellationToken)));

    [HttpGet("articles")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PendingArticleDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PendingArticleDto>>>> GetPending(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<PendingArticleDto>>.Ok(await service.GetPendingAsync(cancellationToken)));

    [HttpGet("articles/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<EditableArticleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<EditableArticleDto>>> Get(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<EditableArticleDto>.Ok(await service.GetForValidationAsync(id, cancellationToken)));

    [HttpPost("articles/{id:int}/validate")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Validate(
        int id,
        [FromBody] ValidateArticleRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.ValidateAsync(id, request, cancellationToken)));

    [HttpPost("articles/{id:int}/deny")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Deny(
        int id,
        [FromBody] ArticleCommentRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DenyAsync(id, request, cancellationToken)));

    [HttpPost("articles/{id:int}/remove")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Remove(
        int id,
        [FromBody] ArticleCommentRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.RemoveAsync(id, request, cancellationToken)));

    [HttpPost("import-crm")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> ImportFromCrm(CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.ImportFromCrmAsync(cancellationToken)));
}
