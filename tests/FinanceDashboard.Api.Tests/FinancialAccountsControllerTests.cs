using System.Security.Claims;
using FinanceDashboard.Api.Controllers;
using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Audit;
using FinanceDashboard.Api.Services.BankSync;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FinanceDashboard.Api.Tests;

public class FinancialAccountsControllerTests
{
    [Fact]
    public async Task Create_PersistsFinancialAccountForAuthenticatedUser()
    {
        using var context = CreateContext();
        var controller = CreateController(context, userId: 11);

        var dto = new FinancialAccountCreateRequest
        {
            Provider = "manual-import",
            InstitutionName = "Banco Finova",
            AccountName = "Conta principal",
            AccountMask = "1234"
        };

        var result = await controller.Create(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var payload = Assert.IsType<FinancialAccountResponse>(created.Value);
        var entity = await context.FinancialAccounts.SingleAsync();

        Assert.Equal(11, entity.UserId);
        Assert.Equal("pending", entity.Status);
        Assert.Equal("manual-import", payload.Provider);
        Assert.Contains(context.AuditLogs, log => log.Action == "financial-account.created");
    }

    [Fact]
    public async Task Sync_UpdatesStatusAndLastSyncDate()
    {
        using var context = CreateContext();
        context.FinancialAccounts.Add(new FinancialAccount
        {
            UserId = 4,
            Provider = "manual-import",
            InstitutionName = "Banco Finova",
            AccountName = "Conta principal",
            Status = "pending"
        });
        await context.SaveChangesAsync();

        var accountId = await context.FinancialAccounts.Select(item => item.Id).SingleAsync();
        var controller = CreateController(context, userId: 4);

        var result = await controller.Sync(accountId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<FinancialAccountSyncResponse>(ok.Value);
        var entity = await context.FinancialAccounts.SingleAsync();

        Assert.Equal("connected", payload.Status);
        Assert.Equal("connected", entity.Status);
        Assert.NotNull(entity.LastSyncedAtUtc);
        Assert.Equal(0, payload.ImportedCount);
        Assert.Contains(context.AuditLogs, log => log.Action == "financial-account.synced");
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static FinancialAccountsController CreateController(AppDbContext context, int userId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, $"User {userId}"),
        };

        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
        };

        var accessor = new HttpContextAccessor
        {
            HttpContext = httpContext
        };

        var controller = new FinancialAccountsController(
            context,
            new CurrentUserService(accessor),
            new AuditLogService(context, accessor),
            new BankSyncService(context, new IBankSyncProvider[] { new PlaceholderBankSyncProvider() }));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }
}
