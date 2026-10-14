using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.DTOs.Catalog;

public sealed record ArticleRefDto(int ArticleId, string? Code, string Title);

public sealed record ProductListItemDto(
    int ProductId,
    string Name,
    int? CategoryId,
    string? CategoryCode,
    string? CategoryName,
    int ArticleCount,
    bool IsLocal);

public sealed record SaveProductRequest(string Name, int? CategoryId);

public sealed record NamedItemDto(int Id, string Name, int ArticleCount);

public sealed record NamedItemArticlesDto(int Id, string Name, IReadOnlyList<ArticleRefDto> Articles);

public sealed record SaveNameRequest(string Name);

public sealed record PackDto(int ProductId, string ProductName, IReadOnlyList<LookupDto> IncludedProducts);

public sealed record SavePackRequest(IReadOnlyList<int> IncludedProductIds);

public sealed record CategoryListItemDto(int CategoryId, string Name, string Code, int ProductCount);

public sealed record CategoryDetailDto(int CategoryId, string Name, string Code, IReadOnlyList<LookupDto> Products);

public sealed record SaveCategoryRequest(string Name, string Code, IReadOnlyList<int>? ProductIds);

public sealed record CrmSyncResultDto(int Added, int Updated, int Removed);
