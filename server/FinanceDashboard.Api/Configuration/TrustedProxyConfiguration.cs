using System.Net;
using Microsoft.AspNetCore.HttpOverrides;

namespace FinanceDashboard.Api.Configuration;

public static class TrustedProxyConfiguration
{
    public static IServiceCollection AddHestiaForwardedHeaders(
        this IServiceCollection services, IConfiguration configuration)
    {
        var proxies = Split(configuration["ReverseProxy:KnownProxies"])
            .Select(value => IPAddress.TryParse(value, out var address) &&
                !address.Equals(IPAddress.Any) && !address.Equals(IPAddress.IPv6Any)
                    ? address
                    : throw new InvalidOperationException("ReverseProxy:KnownProxies contém um IP inválido."))
            .ToArray();
        var networks = Split(configuration["ReverseProxy:KnownNetworks"])
            .Select(value => System.Net.IPNetwork.TryParse(value, out var network) && network.PrefixLength > 0
                ? network
                : throw new InvalidOperationException("ReverseProxy:KnownNetworks exige CIDRs válidos e não permite /0."))
            .ToArray();

        if (string.Equals(configuration["ASPNETCORE_FORWARDEDHEADERS_ENABLED"], "true", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Remova ASPNETCORE_FORWARDEDHEADERS_ENABLED e configure ReverseProxy explicitamente.");
        }

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.KnownProxies.Clear();
            options.KnownIPNetworks.Clear();
            foreach (var proxy in proxies) options.KnownProxies.Add(proxy);
            foreach (var network in networks) options.KnownIPNetworks.Add(network);
            // Empty trust lists must never activate ASP.NET's trust-all behavior.
            options.ForwardedHeaders = proxies.Length + networks.Length == 0
                ? ForwardedHeaders.None
                : ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
        });
        return services;
    }

    private static string[] Split(string? value) =>
        (value ?? "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
