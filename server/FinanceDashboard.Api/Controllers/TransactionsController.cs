using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Audit;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AuditLogService _auditLogService;
        private readonly CurrentUserService _currentUserService;

        public TransactionsController(
            AppDbContext context,
            CurrentUserService currentUserService,
            AuditLogService auditLogService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<TransactionResponse>>> GetAll()
        {
            var userId = _currentUserService.GetRequiredUserId();

            var transactions = await _context.Transactions
                .Where(transaction => transaction.UserId == userId)
                .OrderByDescending(transaction => transaction.Date)
                .Select(transaction => ToResponse(transaction))
                .ToListAsync();

            return Ok(transactions);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TransactionResponse>> GetById(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var transaction = await _context.Transactions
                .Where(transaction => transaction.Id == id && transaction.UserId == userId)
                .Select(transaction => ToResponse(transaction))
                .FirstOrDefaultAsync();

            if (transaction is null)
            {
                return NotFound();
            }

            return Ok(transaction);
        }

        [HttpPost]
        public async Task<ActionResult<TransactionResponse>> Create(TransactionCreateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var transaction = new Transaction
            {
                Description = dto.Description.Trim(),
                Category = dto.Category.Trim(),
                AmountCents = dto.AmountCents,
                Date = dto.Date,
                Type = dto.Type.Trim().ToLowerInvariant(),
                UserId = userId
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();
            await _auditLogService.WriteAsync(
                action: "transaction.created",
                entityType: "Transaction",
                entityId: transaction.Id.ToString(),
                userId: userId,
                summary: $"Transacao criada: {transaction.Description} ({transaction.Type}).");

            return CreatedAtAction(
                nameof(GetById),
                new { id = transaction.Id },
                ToResponse(transaction));
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<TransactionResponse>> Update(int id, TransactionUpdateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(existing => existing.Id == id && existing.UserId == userId);

            if (transaction is null)
            {
                return NotFound();
            }

            transaction.Description = dto.Description.Trim();
            transaction.Category = dto.Category.Trim();
            transaction.AmountCents = dto.AmountCents;
            transaction.Date = dto.Date;
            transaction.Type = dto.Type.Trim().ToLowerInvariant();

            await _context.SaveChangesAsync();
            await _auditLogService.WriteAsync(
                action: "transaction.updated",
                entityType: "Transaction",
                entityId: transaction.Id.ToString(),
                userId: userId,
                summary: $"Transacao atualizada: {transaction.Description} ({transaction.Type}).");

            return Ok(ToResponse(transaction));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(existing => existing.Id == id && existing.UserId == userId);

            if (transaction is null)
            {
                return NotFound();
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            await _auditLogService.WriteAsync(
                action: "transaction.deleted",
                entityType: "Transaction",
                entityId: id.ToString(),
                userId: userId,
                summary: $"Transacao removida: {transaction.Description} ({transaction.Type}).");

            return NoContent();
        }

        private static TransactionResponse ToResponse(Transaction transaction)
        {
            return new TransactionResponse
            {
                Id = transaction.Id,
                Description = transaction.Description,
                Category = transaction.Category,
                AmountCents = transaction.AmountCents,
                Date = transaction.Date,
                Type = transaction.Type
            };
        }
    }
}
