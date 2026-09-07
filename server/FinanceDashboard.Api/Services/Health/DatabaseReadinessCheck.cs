using FinanceDashboard.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FinanceDashboard.Api.Services.Health;

public interface IDatabaseReadinessProbe
{
    Task<bool> IsReadyAsync(CancellationToken cancellationToken);
}

public sealed class DatabaseReadinessProbe(AppDbContext context) : IDatabaseReadinessProbe
{
    public async Task<bool> IsReadyAsync(CancellationToken cancellationToken)
    {
        if (!await context.Database.CanConnectAsync(cancellationToken)) return false;

        // A missing migration history must not be mistaken for an up-to-date database.
        var expected = context.Database.GetMigrations().ToArray();
        if (expected.Length == 0) return false;
        var applied = (await context.Database.GetAppliedMigrationsAsync(cancellationToken)).ToHashSet();
        return expected.All(applied.Contains);
    }
}

public sealed class DatabaseReadinessCheck(IDatabaseReadinessProbe probe) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await probe.IsReadyAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Database unavailable or migrations pending.");
        }
        catch (Exception)
        {
            // Keep connection details and provider exceptions out of public reports/logs.
            return HealthCheckResult.Unhealthy("Database readiness could not be confirmed.");
        }
    }
}
