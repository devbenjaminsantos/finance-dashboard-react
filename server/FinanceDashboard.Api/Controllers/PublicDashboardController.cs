using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs.PublicDashboard;
using FinanceDashboard.Api.Services.PublicDashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/public-dashboard")]
    [AllowAnonymous]
    public class PublicDashboardController : ControllerBase
    {
        private const int PublicDashboardTransactionLimit = 100;
        private const int PublicDashboardPeriodMonths = 12;

        private readonly AppDbContext _context;
        private readonly PublicDashboardTokenService _publicDashboardTokenService;

        public PublicDashboardController(
            AppDbContext context,
            PublicDashboardTokenService publicDashboardTokenService)
        {
            _context = context;
            _publicDashboardTokenService = publicDashboardTokenService;
        }

        [HttpGet("{token}")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<PublicDashboardResponse>> Get(string token)
        {
            if (!_publicDashboardTokenService.TryHashToken(token, out var tokenHash))
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Painel público não encontrado.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            var now = DateTime.UtcNow;
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(existing =>
                    existing.PublicDashboardEnabled &&
                    existing.PublicDashboardTokenHash == tokenHash &&
                    (!existing.IsDemoAccount ||
                        (existing.DemoExpiresAtUtc.HasValue && existing.DemoExpiresAtUtc > now)));

            if (user is null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Painel público não encontrado.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            var currentMonthStart = new DateTime(now.Year, now.Month, 1);
            var periodStart = currentMonthStart.AddMonths(-(PublicDashboardPeriodMonths - 1));
            var nextMonthStart = currentMonthStart.AddMonths(1);

            var transactions = await _context.Transactions
                .AsNoTracking()
                .Where(transaction =>
                    transaction.UserId == user.Id &&
                    transaction.Date >= periodStart &&
                    transaction.Date < nextMonthStart)
                .OrderByDescending(transaction => transaction.Date)
                .Take(PublicDashboardTransactionLimit)
                .Select(transaction => new
                {
                    transaction.Date,
                    transaction.Category,
                    transaction.AmountCents,
                    transaction.Type
                })
                .ToListAsync();

            var publicTransactions = transactions
                .Select(transaction => new PublicDashboardTransactionResponse
                {
                    Date = new DateTime(transaction.Date.Year, transaction.Date.Month, 1),
                    Category = transaction.Category,
                    AmountCents = transaction.AmountCents,
                    Type = transaction.Type
                })
                .ToList();

            return Ok(new PublicDashboardResponse
            {
                DisplayName = user.Name,
                LastTransactionDate = transactions.Count == 0
                    ? null
                    : new DateTime(transactions[0].Date.Year, transactions[0].Date.Month, 1),
                Transactions = publicTransactions
            });
        }
    }
}
