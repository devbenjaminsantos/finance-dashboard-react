using FinanceDashboard.Api.Controllers;
using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs.PublicDashboard;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.PublicDashboard;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FinanceDashboard.Api.Tests;

public class PublicDashboardControllerTests
{
    [Fact]
    public async Task Get_WithActiveToken_ReturnsReadOnlyDashboard()
    {
        using var context = CreateContext();
        var tokenService = new PublicDashboardTokenService();
        var token = tokenService.GenerateToken();
        Assert.True(tokenService.TryHashToken(token, out var tokenHash));

        context.Users.Add(CreateUser(tokenHash));
        context.Transactions.Add(new Transaction
        {
            Id = 11,
            UserId = 7,
            Description = "Mercado",
            Category = "Alimentação",
            AmountCents = 12990,
            Date = new DateTime(2026, 8, 23),
            Type = "expense"
        });
        await context.SaveChangesAsync();

        var controller = new PublicDashboardController(context, tokenService);
        var result = await controller.Get(token);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<PublicDashboardResponse>(ok.Value);
        Assert.Equal("Keller", payload.DisplayName);
        Assert.Single(payload.Transactions);
        Assert.Equal(12990, payload.Transactions[0].AmountCents);
        Assert.Equal(new DateTime(2026, 8, 1), payload.Transactions[0].Date);
        Assert.Equal(new DateTime(2026, 8, 1), payload.LastTransactionDate);
    }

    [Fact]
    public async Task Get_ReturnsOnlyTheMostRecentHundredTransactionsFromTheLastTwelveMonths()
    {
        using var context = CreateContext();
        var tokenService = new PublicDashboardTokenService();
        var token = tokenService.GenerateToken();
        Assert.True(tokenService.TryHashToken(token, out var tokenHash));

        context.Users.Add(CreateUser(tokenHash));

        var currentMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var periodStart = currentMonthStart.AddMonths(-11);
        context.Transactions.AddRange(Enumerable.Range(1, 101).Select(index => new Transaction
        {
            Id = index,
            UserId = 7,
            Description = $"Private transaction {index}",
            Category = "Shared category",
            AmountCents = index,
            Date = currentMonthStart,
            Type = "expense",
            IsRecurring = true
        }));
        context.Transactions.AddRange(
            new Transaction
            {
                Id = 102,
                UserId = 7,
                Description = "Old private transaction",
                Category = "Must not be shared",
                AmountCents = 999,
                Date = periodStart.AddTicks(-1),
                Type = "expense"
            },
            new Transaction
            {
                Id = 103,
                UserId = 7,
                Description = "Future private transaction",
                Category = "Must not be shared",
                AmountCents = 999,
                Date = currentMonthStart.AddMonths(1),
                Type = "expense"
            });
        await context.SaveChangesAsync();

        var controller = new PublicDashboardController(context, tokenService);
        var result = await controller.Get(token);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<PublicDashboardResponse>(ok.Value);
        Assert.Equal(100, payload.Transactions.Count);
        Assert.All(payload.Transactions, transaction =>
        {
            Assert.Equal(currentMonthStart, transaction.Date);
            Assert.Equal("Shared category", transaction.Category);
        });
        Assert.Equal(
            ["Date", "Category", "AmountCents", "Type"],
            typeof(PublicDashboardTransactionResponse).GetProperties().Select(property => property.Name));
    }

    [Fact]
    public async Task Get_AfterRotation_RejectsOldTokenAndAcceptsNewToken()
    {
        using var context = CreateContext();
        var tokenService = new PublicDashboardTokenService();
        var oldToken = tokenService.GenerateToken();
        var newToken = tokenService.GenerateToken();
        Assert.True(tokenService.TryHashToken(oldToken, out var oldHash));
        Assert.True(tokenService.TryHashToken(newToken, out var newHash));

        var user = CreateUser(oldHash);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        user.PublicDashboardTokenHash = newHash;
        await context.SaveChangesAsync();

        var controller = new PublicDashboardController(context, tokenService);
        var oldResult = await controller.Get(oldToken);
        var newResult = await controller.Get(newToken);

        Assert.IsType<NotFoundObjectResult>(oldResult.Result);
        Assert.IsType<OkObjectResult>(newResult.Result);
    }

    [Fact]
    public async Task Get_AfterRevocation_ReturnsNotFound()
    {
        using var context = CreateContext();
        var tokenService = new PublicDashboardTokenService();
        var token = tokenService.GenerateToken();
        Assert.True(tokenService.TryHashToken(token, out var tokenHash));

        var user = CreateUser(tokenHash);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        user.PublicDashboardEnabled = false;
        user.PublicDashboardTokenHash = null;
        await context.SaveChangesAsync();

        var controller = new PublicDashboardController(context, tokenService);
        var result = await controller.Get(token);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task Get_ForExpiredDemoAccount_ReturnsNotFound()
    {
        using var context = CreateContext();
        var tokenService = new PublicDashboardTokenService();
        var token = tokenService.GenerateToken();
        Assert.True(tokenService.TryHashToken(token, out var tokenHash));

        var user = CreateUser(tokenHash);
        user.IsDemoAccount = true;
        user.DemoExpiresAtUtc = DateTime.UtcNow.AddMinutes(-1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = new PublicDashboardController(context, tokenService);
        var result = await controller.Get(token);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static User CreateUser(string tokenHash)
    {
        return new User
        {
            Id = 7,
            Name = "Keller",
            Email = "keller@hestia.local",
            EmailConfirmed = true,
            PasswordHash = "test-only",
            PublicDashboardEnabled = true,
            PublicDashboardTokenHash = tokenHash
        };
    }
}
