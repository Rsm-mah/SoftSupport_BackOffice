using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Api.Security;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Comments;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

[Route("api/softsupport/comments")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Redaction)]
public sealed class CommentsController(ICommentService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CommentListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<CommentListItemDto>>>> Search(
        [FromQuery] CommentsQuery query,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<PagedResult<CommentListItemDto>>.Ok(await service.SearchAsync(query, cancellationToken)));

    [HttpGet("count")]
    [ProducesResponseType(typeof(ApiResponse<CommentCountDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CommentCountDto>>> Count(CancellationToken cancellationToken) =>
        Ok(ApiResponse<CommentCountDto>.Ok(await service.CountPendingAsync(cancellationToken)));

    [HttpPost("{id:int}/reply")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Reply(
        int id,
        [FromBody] ReplyToCommentRequest request,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.ReplyAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteAsync(id, cancellationToken)));
}
