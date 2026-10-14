using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftSupport.Api.Security;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Api.Controllers;

[Route("api/softsupport/products")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
public sealed class ProductsController(IProductService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProductListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductListItemDto>>>> GetAll(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ProductListItemDto>>.Ok(await service.GetListAsync(cancellationToken)));

    [HttpGet("{id:int}/articles")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ArticleRefDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ArticleRefDto>>>> GetArticles(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ArticleRefDto>>.Ok(await service.GetArticlesAsync(id, cancellationToken)));

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] SaveProductRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.CreateAsync(request, cancellationToken)));

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] SaveProductRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.UpdateAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteAsync(id, cancellationToken)));

    [HttpPost("import-crm")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> ImportFromCrm(CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.ImportFromCrmAsync(cancellationToken)));
}

/// <summary>Produits proposés dans les packs (administrateur) et les contrats clients (commerciaux).</summary>
[Route("api/softsupport/products/lookup")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.CatalogLookup)]
public sealed class ProductLookupController(IProductService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LookupDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LookupDto>>>> GetLookup(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<LookupDto>>.Ok(await service.GetLookupAsync(cancellationToken)));
}

[Route("api/softsupport/packs")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
public sealed class PacksController(IProductService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PackDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PackDto>>>> GetAll(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<PackDto>>.Ok(await service.GetPacksAsync(cancellationToken)));

    [HttpPut("{productId:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Save(int productId, [FromBody] SavePackRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.SavePackAsync(productId, request, cancellationToken)));

    [HttpDelete("{productId:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int productId, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeletePackAsync(productId, cancellationToken)));
}

[Route("api/softsupport/themes")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
public sealed class ThemesController(IThemeService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NamedItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NamedItemDto>>>> GetAll(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<NamedItemDto>>.Ok(await service.GetListAsync(cancellationToken)));

    [HttpGet("{id:int}/articles")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ArticleRefDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ArticleRefDto>>>> GetArticles(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ArticleRefDto>>.Ok(await service.GetArticlesAsync(id, cancellationToken)));

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] SaveNameRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.CreateAsync(request, cancellationToken)));

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] SaveNameRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.UpdateAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteAsync(id, cancellationToken)));
}

[Route("api/softsupport/versions")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
public sealed class VersionsController(IVersionService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NamedItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NamedItemDto>>>> GetAll(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<NamedItemDto>>.Ok(await service.GetListAsync(cancellationToken)));

    [HttpGet("{id:int}/articles")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ArticleRefDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ArticleRefDto>>>> GetArticles(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ArticleRefDto>>.Ok(await service.GetArticlesAsync(id, cancellationToken)));

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] SaveNameRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.CreateAsync(request, cancellationToken)));

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] SaveNameRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.UpdateAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteAsync(id, cancellationToken)));

    [HttpPost("import-crm")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> ImportFromCrm(CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.ImportFromCrmAsync(cancellationToken)));
}

[Route("api/softsupport/categories")]
[Authorize(Policy = SoftSupportAuthorizationPolicies.Administration)]
public sealed class CategoriesController(ICategoryService service) : SoftSupportControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CategoryListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CategoryListItemDto>>>> GetAll(CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<CategoryListItemDto>>.Ok(await service.GetListAsync(cancellationToken)));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<CategoryDetailDto>>> Get(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<CategoryDetailDto>.Ok(await service.GetDetailAsync(id, cancellationToken)));

    /// <summary>Produits sans catégorie, plus ceux de la catégorie indiquée.</summary>
    [HttpGet("assignable-products")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LookupDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LookupDto>>>> GetAssignableProducts(
        [FromQuery] int? categoryId,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<LookupDto>>.Ok(await service.GetAssignableProductsAsync(categoryId, cancellationToken)));

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Create([FromBody] SaveCategoryRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.CreateAsync(request, cancellationToken)));

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(int id, [FromBody] SaveCategoryRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.UpdateAsync(id, request, cancellationToken)));

    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(int id, CancellationToken cancellationToken) =>
        Ok(ApiResponse.Ok(message: await service.DeleteAsync(id, cancellationToken)));
}
