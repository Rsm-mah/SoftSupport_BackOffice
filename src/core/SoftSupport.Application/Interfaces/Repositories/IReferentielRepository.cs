using SoftSupport.Application.DTOs.Users;

namespace SoftSupport.Application.Interfaces.Repositories;

public interface IReferentielRepository
{
    Task<IReadOnlyList<LookupDto>> GetRolesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<LookupDto>> GetDepartementsAsync(CancellationToken cancellationToken);

    Task<bool> RoleExistsAsync(int roleId, CancellationToken cancellationToken);

    Task<bool> DepartementExistsAsync(int departementId, CancellationToken cancellationToken);
}