namespace SoftSupport.Application.Interfaces.Services;

public interface IContractAlertService
{
    Task<int> SendDueAlertsAsync(CancellationToken cancellationToken);
}