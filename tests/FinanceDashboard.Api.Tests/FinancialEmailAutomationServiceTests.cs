using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Email;
using FinanceDashboard.Api.Services.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace FinanceDashboard.Api.Tests;

public class FinancialEmailAutomationServiceTests
{
    [Fact]
    public async Task ProcessAsync_SendsGoalAlertOnce_WhenThresholdIsReached()
    {
        using var context = CreateContext();
        var emailSender = new FakeEmailSender();
        var user = new User
        {
            Id = 7,
            Name = "Keller",
            Email = "keller@finova.app",
            EmailConfirmed = true,
            EmailGoalAlertsEnabled = true,
            GoalAlertThresholdPercent = 80
        };

        context.Users.Add(user);
        context.BudgetGoals.Add(new BudgetGoal
        {
            UserId = user.Id,
            Month = "2026-04",
            Category = string.Empty,
            AmountCents = 100_00
        });
        context.Transactions.Add(new Transaction
        {
            UserId = user.Id,
            Description = "Mercado",
            Category = "Alimentacao",
            AmountCents = 85_00,
            Date = new DateTime(2026, 4, 10),
            Type = "expense"
        });
        await context.SaveChangesAsync();

        var service = CreateService(context, emailSender);

        await service.ProcessAsync(new DateTime(2026, 4, 15));
        await service.ProcessAsync(new DateTime(2026, 4, 15));

        Assert.Single(emailSender.GoalAlerts);
        Assert.Single(context.NotificationDeliveries.Where(delivery => delivery.NotificationType == "goal_alert"));
    }

    [Fact]
    public async Task ProcessAsync_SendsMonthlyReport_ForPreviousMonth_WhenEnabled()
    {
        using var context = CreateContext();
        var emailSender = new FakeEmailSender();
        var user = new User
        {
            Id = 8,
            Name = "Keller",
            Email = "keller@finova.app",
            EmailConfirmed = true,
            MonthlyReportEmailsEnabled = true,
            MonthlyReportDay = 1
        };

        context.Users.Add(user);
        context.BudgetGoals.Add(new BudgetGoal
        {
            UserId = user.Id,
            Month = "2026-03",
            Category = "Moradia",
            AmountCents = 300_00
        });
        context.Transactions.AddRange(
            new Transaction
            {
                UserId = user.Id,
                Description = "Salario",
                Category = "Salario",
                AmountCents = 1500_00,
                Date = new DateTime(2026, 3, 5),
                Type = "income"
            },
            new Transaction
            {
                UserId = user.Id,
                Description = "Aluguel",
                Category = "Moradia",
                AmountCents = 280_00,
                Date = new DateTime(2026, 3, 6),
                Type = "expense"
            });
        await context.SaveChangesAsync();

        var service = CreateService(context, emailSender);

        await service.ProcessAsync(new DateTime(2026, 4, 1));

        Assert.Single(emailSender.MonthlyReports);
        Assert.Contains(context.NotificationDeliveries, delivery => delivery.NotificationType == "monthly_report");
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static FinancialEmailAutomationService CreateService(
        AppDbContext context,
        FakeEmailSender emailSender)
    {
        return new FinancialEmailAutomationService(
            context,
            emailSender,
            NullLogger<FinancialEmailAutomationService>.Instance);
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public List<string> GoalAlerts { get; } = new();
        public List<string> MonthlyReports { get; } = new();

        public Task SendPasswordResetEmailAsync(string toEmail, string name, string resetUrl)
        {
            return Task.CompletedTask;
        }

        public Task SendEmailVerificationAsync(string toEmail, string name, string verificationUrl)
        {
            return Task.CompletedTask;
        }

        public Task SendBudgetGoalAlertEmailAsync(
            string toEmail,
            string name,
            string monthLabel,
            string goalLabel,
            int progressPercent,
            decimal spentAmount,
            decimal targetAmount)
        {
            GoalAlerts.Add($"{toEmail}:{monthLabel}:{goalLabel}:{progressPercent}");
            return Task.CompletedTask;
        }

        public Task SendMonthlySummaryEmailAsync(
            string toEmail,
            string name,
            string monthLabel,
            decimal incomeAmount,
            decimal expenseAmount,
            decimal balanceAmount,
            string? topExpenseCategory,
            decimal? topExpenseAmount,
            IReadOnlyList<MonthlyGoalSummary> goalSummaries)
        {
            MonthlyReports.Add($"{toEmail}:{monthLabel}:{incomeAmount}:{expenseAmount}");
            return Task.CompletedTask;
        }
    }
}
