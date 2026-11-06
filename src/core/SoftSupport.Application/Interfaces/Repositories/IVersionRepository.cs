using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Domain.Entities;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IVersionRepository
{
    Task<IReadOnlyList<NamedItemDto>> GetListAsync(CancellationToken cancellationToken);

    Task<SoftwareVersion?> FindAsync(int versionId, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, int? excludedId, CancellationToken cancellationToken);

    Task<IReadOnlyList<ArticleRefDto>> GetArticlesAsync(int versionId, CancellationToken cancellationToken);

    Task<List<SoftwareVersion>> GetAllTrackedAsync(CancellationToken cancellationToken);

    Task AddAsync(SoftwareVersion version, CancellationToken cancellationToken);

    void Remove(SoftwareVersion version);

    void RemoveRange(IEnumerable<SoftwareVersion> versions);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}