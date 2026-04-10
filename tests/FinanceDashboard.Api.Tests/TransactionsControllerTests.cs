using System.Security.Claims;
using FinanceDashboard.Api.Controllers;
using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Audit;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FinanceDashboard.Api.Tests;

public class TransactionsControllerTests
{
    [Fact]
    public async Task GetAll_ReturnsOnlyTransactionsFromAuthenticatedUser()
    {
        using var context = CreateContext();
        SeedTransactions(context);

        var controller = CreateController(context, userId: 1);

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsAssignableFrom<IReadOnlyList<TransactionResponse>>(ok.Value);

        Assert.Equal(2, payload.Count);
        Assert.All(payload, item => Assert.Contains(item.Description, new[] { "Mercado", "Salário" }));
        Assert.DoesNotContain(payload, item => item.Description == "Outro usuário");
    }

    [Fact]
    public async Task Create_PersistsTransactionForAuthenticatedUser()
    {
        using var context = CreateContext();
        var controller = CreateController(context, userId: 7);

        var dto = new TransactionCreateRequest
        {
            Description = "Assinatura streaming",
            Category = "Assinaturas",
            AmountCents = 4990,
            Date = new DateTime(2026, 4, 10),
            Type = "expense"
        };

        var result = await controller.Create(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var payload = Assert.IsType<TransactionResponse>(created.Value);
        var entity = await context.Transactions.SingleAsync();

        Assert.Equal(7, entity.UserId);
        Assert.Equal(dto.Description, entity.Description);
        Assert.Equal(dto.Category, entity.Category);
        Assert.Equal(dto.AmountCents, entity.AmountCents);
        Assert.Equal(dto.Type, entity.Type);
        Assert.Equal(entity.Id, payload.Id);
        Assert.Contains(context.AuditLogs, log => log.Action == "transaction.created" && log.UserId == 7);
    }

    [Fact]
    public async Task Update_ReturnsNotFound_WhenTransactionBelongsToAnotherUser()
    {
        using var context = CreateContext();
        SeedTransactions(context);

        var foreignTransaction = await context.Transactions
            .FirstAsync(transaction => transaction.UserId == 2);

        var controller = CreateController(context, userId: 1);

        var result = await controller.Update(foreignTransaction.Id, new TransactionUpdateRequest
        {
            Description = "Não deveria alterar",
            Category = "Outros",
            AmountCents = 1000,
            Date = new DateTime(2026, 4, 10),
            Type = "expense"
        });

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_ChangesOwnedTransaction()
    {
        using var context = CreateContext();
        SeedTransactions(context);

        var ownedTransaction = await context.Transactions
            .FirstAsync(transaction => transaction.UserId == 1 && transaction.Type == "expense");

        var controller = CreateController(context, userId: 1);

        var result = await controller.Update(ownedTransaction.Id, new TransactionUpdateRequest
        {
            Description = "Mercado atualizado",
            Category = "Alimentação",
            AmountCents = 92000,
            Date = new DateTime(2026, 4, 9),
            Type = "expense"
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<TransactionResponse>(ok.Value);
        var entity = await context.Transactions.SingleAsync(transaction => transaction.Id == ownedTransaction.Id);

        Assert.Equal("Mercado atualizado", entity.Description);
        Assert.Equal("Alimentação", entity.Category);
        Assert.Equal(92000, entity.AmountCents);
        Assert.Equal("Mercado atualizado", payload.Description);
        Assert.Contains(context.AuditLogs, log => log.Action == "transaction.updated" && log.EntityId == ownedTransaction.Id.ToString());
    }

    [Fact]
    public async Task Delete_RemovesOwnedTransaction()
    {
        using var context = CreateContext();
        SeedTransactions(context);

        var ownedTransaction = await context.Transactions
            .FirstAsync(transaction => transaction.UserId == 1);

        var controller = CreateController(context, userId: 1);

        var result = await controller.Delete(ownedTransaction.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.DoesNotContain(context.Transactions, transaction => transaction.Id == ownedTransaction.Id);
        Assert.Contains(context.AuditLogs, log => log.Action == "transaction.deleted" && log.EntityId == ownedTransaction.Id.ToString());
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenTransactionBelongsToAnotherUser()
    {
        using var context = CreateContext();
        SeedTransactions(context);

        var foreignTransaction = await context.Transactions
            .FirstAsync(transaction => transaction.UserId == 2);

        var controller = CreateController(context, userId: 1);

        var result = await controller.Delete(foreignTransaction.Id);

        Assert.IsType<NotFoundResult>(result);
        Assert.Contains(context.Transactions, transaction => transaction.Id == foreignTransaction.Id);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static TransactionsController CreateController(AppDbContext context, int userId)
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

        var controller = new TransactionsController(
            context,
            new CurrentUserService(accessor),
            new AuditLogService(context, accessor));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    private static void SeedTransactions(AppDbContext context)
    {
        context.Transactions.AddRange(
            new Transaction
            {
                UserId = 1,
                Description = "Mercado",
                Category = "Alimentação",
                AmountCents = 85000,
                Date = new DateTime(2026, 4, 8),
                Type = "expense"
            },
            new Transaction
            {
                UserId = 1,
                Description = "Salário",
                Category = "Receita fixa",
                AmountCents = 700000,
                Date = new DateTime(2026, 4, 5),
                Type = "income"
            },
            new Transaction
            {
                UserId = 2,
                Description = "Outro usuário",
                Category = "Transporte",
                AmountCents = 21000,
                Date = new DateTime(2026, 4, 7),
                Type = "expense"
            });

        context.SaveChanges();
    }
}
