using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FinanceDashboard.Api.Services.Health;

public sealed class HealthEndpointMetadata;

public static class HealthEndpoints
{
    public static IServiceCollection AddHestiaHealthChecks(this IServiceCollection services)
    {
        services.AddScoped<IDatabaseReadinessProbe, DatabaseReadinessProbe>();
        services.AddHealthChecks().AddCheck<DatabaseReadinessCheck>(
            "database", tags: ["ready"], timeout: TimeSpan.FromSeconds(5));
        return services;
    }

    public static bool IsLivenessPath(PathString path) =>
        path.Equals("/health", StringComparison.OrdinalIgnoreCase) ||
        path.Equals("/health/", StringComparison.OrdinalIgnoreCase) ||
        path.Equals("/health/live", StringComparison.OrdinalIgnoreCase) ||
        path.Equals("/health/live/", StringComparison.OrdinalIgnoreCase);

    public static bool IsHealthEndpoint(HttpContext context) =>
        context.GetEndpoint()?.Metadata.GetMetadata<HealthEndpointMetadata>() is not null;

    public static void MapHestiaHealthChecks(this IEndpointRouteBuilder endpoints)
    {
        foreach (var path in new[] { "/health", "/health/live" })
        {
            endpoints.MapHealthChecks(path, new HealthCheckOptions
            {
                Predicate = _ => false,
                ResponseWriter = (context, _) => context.Response.WriteAsJsonAsync(
                    new { status = "ok" }, cancellationToken: context.RequestAborted)
            }).WithMetadata(new HealthEndpointMetadata()).AllowAnonymous();
        }

        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = registration => registration.Tags.Contains("ready"),
            ResultStatusCodes =
            {
                [HealthStatus.Healthy] = StatusCodes.Status200OK,
                [HealthStatus.Degraded] = StatusCodes.Status503ServiceUnavailable,
                [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
            },
            ResponseWriter = (context, report) => context.Response.WriteAsJsonAsync(
                new { status = report.Status == HealthStatus.Healthy ? "ready" : "not_ready" },
                cancellationToken: context.RequestAborted)
        }).WithMetadata(new HealthEndpointMetadata()).AllowAnonymous();
    }
}
