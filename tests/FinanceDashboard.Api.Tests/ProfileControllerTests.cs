using System.Security.Claims;
using FinanceDashboard.Api.Controllers;
using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Audit;
using FinanceDashboard.Api.Services.Auth;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;
using AppPasswordHasher = FinanceDashboard.Api.Services.Auth.PasswordHasher;

namespace FinanceDashboard.Api.Tests;

public class ProfileControllerTests
{
    [Fact]
    public async Task Get_ReturnsGoalAlertPreferences()
    {
        using var context = CreateContext();
        context.Users.Add(new User
        {
            Id = 7,
            Name = "Keller",
            Email = "keller@finova.app",
            EmailConfirmed = true,
            EmailGoalAlertsEnabled = true,
            GoalAlertThresholdPercent = 90,
            PasswordHash = HashPassword("SenhaSegura123!")
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, 7);

        var result = await controller.Get();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<AuthUserResponse>(ok.Value);

        Assert.True(payload.EmailGoalAlertsEnabled);
        Assert.Equal(90, payload.GoalAlertThresholdPercent);
    }

    [Fact]
    public async Task Update_PersistsGoalAlertPreferences_AndWritesAuditLog()
    {
        using var context = CreateContext();
        var user = new User
        {
            Id = 7,
            Name = "Keller",
            Email = "keller@finova.app",
            EmailConfirmed = true,
            EmailGoalAlertsEnabled = false,
            GoalAlertThresholdPercent = 80
        };
        user.PasswordHash = HashPassword("SenhaSegura123!", user);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = CreateController(context, user.Id);

        var result = await controller.Update(new ProfileUpdateRequest
        {
            Name = "Keller",
            EmailGoalAlertsEnabled = true,
            GoalAlertThresholdPercent = 90
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<AuthUserResponse>(ok.Value);
        var refreshedUser = await context.Users.SingleAsync();

        Assert.True(payload.EmailGoalAlertsEnabled);
        Assert.Equal(90, payload.GoalAlertThresholdPercent);
        Assert.True(refreshedUser.EmailGoalAlertsEnabled);
        Assert.Equal(90, refreshedUser.GoalAlertThresholdPercent);
        Assert.Contains(
            context.AuditLogs,
            log => log.Action == "profile.updated" && log.Summary.Contains("90%"));
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static ProfileController CreateController(AppDbContext context, int userId)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Demo:Email"] = "demo@finova.app"
            })
            .Build();

        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(
            new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                },
                "TestAuth"));

        var httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = httpContext
        };

        var controller = new ProfileController(
            context,
            new CurrentUserService(httpContextAccessor),
            new AppPasswordHasher(new PasswordHasher<User>()),
            new PasswordPolicyService(),
            new AuditLogService(context, httpContextAccessor),
            configuration);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    private static string HashPassword(string password, User? user = null)
    {
        var entity = user ?? new User
        {
            Name = "Seed",
            Email = "seed@finova.app",
            EmailConfirmed = true
        };

        return new AppPasswordHasher(new PasswordHasher<User>()).HashPassword(entity, password);
    }
}
