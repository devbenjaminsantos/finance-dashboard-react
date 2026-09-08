using System.Net;
using FinanceDashboard.Api.Configuration;
using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.Services.Audit;
using FinanceDashboard.Api.Services.Security;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace FinanceDashboard.Api.Tests;

public class TrustedProxyConfigurationTests
{
    [Theory]
    [InlineData("::ffff:198.51.100.24", "203.0.113.77", "198.51.100.24", "http")]
    [InlineData("198.51.100.24", "203.0.113.77", "198.51.100.24", "http")]
    [InlineData("10.20.0.4", "203.0.113.77", "203.0.113.77", "https")]
    [InlineData("10.20.0.4", "192.0.2.99, 203.0.113.77", "203.0.113.77", "https")]
    [InlineData("::ffff:10.20.0.4", "203.0.113.77", "203.0.113.77", "https")]
    public async Task MiddlewareControlsBothAuditAndRateLimit(string peer, string forwarded, string expected, string scheme)
    {
        var options = Configure("10.20.0.4", "");
        var context = Context(peer, forwarded);
        await Apply(context, options);
        using var database = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var audit = new AuditLogService(database, new HttpContextAccessor { HttpContext = context });

        await audit.WriteAsync("test.proxy", "Test", "Proxy test");

        Assert.Equal(expected, RateLimitPartitionKeys.ByIp(context));
        Assert.Equal(expected, (await database.AuditLogs.SingleAsync()).IpAddress);
        Assert.Equal(scheme, context.Request.Scheme);
        Assert.Equal("api.example", context.Request.Host.Value);
    }

    [Fact]
    public async Task EmptyTrustListIgnoresHeadersEvenFromLoopback()
    {
        var context = Context("127.0.0.1", "203.0.113.77");
        await Apply(context, Configure("", ""));
        Assert.Equal("127.0.0.1", RateLimitPartitionKeys.ByIp(context));
        Assert.Equal("http", context.Request.Scheme);
    }

    [Theory]
    [InlineData("10.20.0.4", "203.0.113.77")]
    [InlineData("10.21.0.4", "10.21.0.4")]
    public async Task NetworkTrustDoesNotExtendOutsideConfiguredCidr(string peer, string expected)
    {
        var context = Context(peer, "203.0.113.77");
        await Apply(context, Configure("", "10.20.0.0/16"));
        Assert.Equal(expected, RateLimitPartitionKeys.ByIp(context));
    }

    [Fact]
    public async Task MalformedRightmostAddressIsNotReplacedWithClientSuppliedLeftmostAddress()
    {
        var context = Context("10.20.0.4", "203.0.113.77, invalid");
        await Apply(context, Configure("10.20.0.4", ""));
        Assert.Equal("10.20.0.4", RateLimitPartitionKeys.ByIp(context));
    }

    [Fact]
    public async Task RealIpHeaderAloneCannotOverrideConnectionAddress()
    {
        var context = Context("10.20.0.4", "");
        context.Request.Headers["X-Real-IP"] = "203.0.113.77";
        await Apply(context, Configure("10.20.0.4", ""));
        Assert.Equal("10.20.0.4", RateLimitPartitionKeys.ByIp(context));
    }

    [Theory]
    [InlineData("invalid", "")]
    [InlineData("0.0.0.0", "")]
    [InlineData("::", "")]
    [InlineData("", "invalid")]
    [InlineData("", "0.0.0.0/0")]
    [InlineData("", "::/0")]
    public void InvalidOrTrustAllConfigurationFails(string proxies, string networks)
    {
        Assert.Throws<InvalidOperationException>(() => Configure(proxies, networks));
    }

    [Fact]
    public void RejectsAutomaticForwardedHeadersOverride()
    {
        Assert.Throws<InvalidOperationException>(() => Configure("10.20.0.4", "", "true"));
    }

    private static ForwardedHeadersOptions Configure(string proxies, string networks, string? automatic = null)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ReverseProxy:KnownProxies"] = proxies,
            ["ReverseProxy:KnownNetworks"] = networks,
            ["ASPNETCORE_FORWARDEDHEADERS_ENABLED"] = automatic
        }).Build();
        var services = new ServiceCollection();
        services.AddHestiaForwardedHeaders(configuration);
        using var provider = services.BuildServiceProvider();
        return provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;
    }

    private static DefaultHttpContext Context(string peer, string forwarded)
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Parse(peer);
        context.Request.Scheme = "http";
        context.Request.Host = new HostString("api.example");
        context.Request.Headers["X-Forwarded-For"] = forwarded;
        context.Request.Headers["X-Forwarded-Proto"] = "https";
        context.Request.Headers["X-Forwarded-Host"] = "attacker.example";
        return context;
    }

    private static Task Apply(HttpContext context, ForwardedHeadersOptions options) =>
        new ForwardedHeadersMiddleware(_ => Task.CompletedTask, NullLoggerFactory.Instance, Options.Create(options))
            .Invoke(context);
}
