using System.Net;
using FinanceDashboard.Api.Services.Health;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FinanceDashboard.Api.Tests;

public class HealthEndpointsTests
{
    [Theory]
    [InlineData("/health")]
    [InlineData("/health/live")]
    public async Task LivenessDoesNotQueryDatabaseOrAuthenticate(string path)
    {
        var probe = new Probe(_ => throw new InvalidOperationException("Must not access database"));
        await using var app = await StartApp(probe);
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };
        client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");
        client.DefaultRequestHeaders.Add("Cookie", "hestia_auth=test-cookie");

        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"status\":\"ok\"}", await response.Content.ReadAsStringAsync());
        Assert.Equal(0, probe.Calls);
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Theory]
    [InlineData(true, HttpStatusCode.OK, "ready")]
    [InlineData(false, HttpStatusCode.ServiceUnavailable, "not_ready")]
    public async Task ReadinessReportsDatabaseState(bool ready, HttpStatusCode status, string bodyStatus)
    {
        var probe = new Probe(_ => Task.FromResult(ready));
        await using var app = await StartApp(probe);
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };

        var response = await client.GetAsync("/health/ready");

        Assert.Equal(status, response.StatusCode);
        Assert.Equal($"{{\"status\":\"{bodyStatus}\"}}", await response.Content.ReadAsStringAsync());
        Assert.Equal(1, probe.Calls);
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task ReadinessDoesNotExposeProviderExceptions()
    {
        var probe = new Probe(_ => throw new InvalidOperationException("Host=private;Password=test-secret"));
        await using var app = await StartApp(probe);
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };

        var response = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("{\"status\":\"not_ready\"}", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ReadinessCancelsSlowDatabaseProbe()
    {
        var canceled = false;
        var probe = new Probe(async cancellationToken =>
        {
            try { await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken); }
            catch (OperationCanceledException) { canceled = true; throw; }
            return true;
        });
        await using var app = await StartApp(probe);
        using var client = new HttpClient
        {
            BaseAddress = new Uri(app.Urls.Single()), Timeout = TimeSpan.FromSeconds(15)
        };

        var response = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.True(canceled);
    }

    [Theory]
    [InlineData("/health/ready")]
    [InlineData("/health/unknown")]
    public void OnlyLivenessIsExemptFromGlobalRateLimit(string path)
    {
        Assert.False(HealthEndpoints.IsLivenessPath(path));
        Assert.True(HealthEndpoints.IsLivenessPath("/health"));
        Assert.True(HealthEndpoints.IsLivenessPath("/health/live/"));
    }

    [Fact]
    public async Task OrdinaryEndpointsStillUseAuthenticationBranch()
    {
        await using var app = await StartApp(new Probe(_ => Task.FromResult(true)));
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/private")).StatusCode);
    }

    private static async Task<WebApplication> StartApp(Probe probe)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Testing", ContentRootPath = Path.GetTempPath()
        });
        builder.Logging.ClearProviders();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Services.AddHestiaHealthChecks();
        builder.Services.AddScoped<IDatabaseReadinessProbe>(_ => probe);
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
        {
            options.Events.OnMessageReceived = context =>
            {
                if (HealthEndpoints.IsHealthEndpoint(context.HttpContext)) context.NoResult();
                return Task.CompletedTask;
            };
        });
        builder.Services.AddAuthorization();
        var app = builder.Build();
        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapHestiaHealthChecks();
        app.MapGet("/private", () => Results.Ok()).RequireAuthorization();
        await app.StartAsync();
        return app;
    }

    private sealed class Probe(Func<CancellationToken, Task<bool>> run) : IDatabaseReadinessProbe
    {
        public int Calls { get; private set; }
        public Task<bool> IsReadyAsync(CancellationToken cancellationToken)
        {
            Calls++;
            return run(cancellationToken);
        }
    }
}
