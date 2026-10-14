using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SoftSupport.Application;
using SoftSupport.Application.Interfaces;

namespace SoftSupport.Infrastructure.Jobs;

public sealed class ContractAlertBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<SoftSupportOptions> options,
    TimeProvider clock,
    ILogger<ContractAlertBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.ContractAlertsEnabled)
        {
            logger.LogInformation("Alertes d'échéance de contrat désactivées");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = clock.GetLocalNow();
            var nextRun = new DateTimeOffset(now.Date.AddDays(1), now.Offset);
            try
            {
                await Task.Delay(nextRun - now, clock, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<IContractAlertService>().SendDueAlertsAsync(stoppingToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogError(exception, "Échec de la vérification des échéances de contrat");
            }
        }
    }
}
