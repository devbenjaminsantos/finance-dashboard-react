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

            if (!TryBuildOccurrenceDates(dto, out var occurrenceDates, out var validationError))
            {
                ModelState.AddModelError(nameof(dto.RecurrenceEndDate), validationError);
                return ValidationProblem(ModelState);
            }

            var recurrenceGroupId = dto.IsRecurring
                ? Guid.NewGuid().ToString("N")
                : null;

            var transactions = occurrenceDates
                .Select(date => BuildTransactionEntity(dto, userId, date, recurrenceGroupId))
                .ToList();

            _context.Transactions.AddRange(transactions);
            await _context.SaveChangesAsync();

            var firstTransaction = transactions[0];
            var summary = dto.IsRecurring
                ? $"Série recorrente criada: {firstTransaction.Description} ({transactions.Count} lançamentos mensais)."
                : $"Transação criada: {firstTransaction.Description} ({firstTransaction.Type}).";

            await _auditLogService.WriteAsync(
                action: "transaction.created",
                entityType: "Transaction",
                entityId: firstTransaction.Id.ToString(),
                userId: userId,
                summary: summary);

            return CreatedAtAction(
                nameof(GetById),
                new { id = firstTransaction.Id },
                ToResponse(firstTransaction));
        }

        [HttpPost("import")]
        public async Task<ActionResult<TransactionImportResponse>> Import(TransactionImportRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();

            if (dto.Transactions.Count > 500)
            {
                ModelState.AddModelError(nameof(dto.Transactions), "Limite de 500 transações por importação.");
                return ValidationProblem(ModelState);
            }

            var transactions = new List<Transaction>();

            for (var index = 0; index < dto.Transactions.Count; index += 1)
            {
                var item = dto.Transactions[index];

                if (item.IsRecurring)
                {
                    ModelState.AddModelError(
                        $"{nameof(dto.Transactions)}[{index}].{nameof(item.IsRecurring)}",
                        "A importação CSV inicial não aceita recorrência automática.");
                    return ValidationProblem(ModelState);
                }

                transactions.Add(BuildTransactionEntity(item, userId, item.Date.Date, recurrenceGroupId: null));
            }

            _context.Transactions.AddRange(transactions);
            await _context.SaveChangesAsync();

            await _auditLogService.WriteAsync(
                action: "transaction.imported",
                entityType: "Transaction",
                entityId: transactions[0].Id.ToString(),
                userId: userId,
                summary: $"Importação CSV concluída com {transactions.Count} transações.");

            return Ok(new TransactionImportResponse
            {
                ImportedCount = transactions.Count
            });
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
            transaction.Date = dto.Date.Date;
            transaction.Type = dto.Type.Trim().ToLowerInvariant();

            await _context.SaveChangesAsync();
            await _auditLogService.WriteAsync(
                action: "transaction.updated",
                entityType: "Transaction",
                entityId: transaction.Id.ToString(),
                userId: userId,
                summary: $"Transação atualizada: {transaction.Description} ({transaction.Type}).");

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
                summary: $"Transação removida: {transaction.Description} ({transaction.Type}).");

            return NoContent();
        }

        private static bool TryBuildOccurrenceDates(
            TransactionRequest dto,
            out List<DateTime> occurrenceDates,
            out string validationError)
        {
            occurrenceDates = new List<DateTime>();
            validationError = string.Empty;

            var startDate = dto.Date.Date;

            if (!dto.IsRecurring)
            {
                occurrenceDates.Add(startDate);
                return true;
            }

            if (!dto.RecurrenceEndDate.HasValue)
            {
                validationError = "Informe até quando a recorrência mensal deve ser gerada.";
                return false;
            }

            var endDate = dto.RecurrenceEndDate.Value.Date;
            var minimumEndDate = startDate.AddMonths(1);

            if (endDate < minimumEndDate)
            {
                validationError = "A recorrência mensal precisa alcançar pelo menos o próximo mês.";
                return false;
            }

            var currentDate = startDate;

            while (currentDate <= endDate)
            {
                occurrenceDates.Add(currentDate);

                if (occurrenceDates.Count > 60)
                {
                    validationError = "Limite de 60 lançamentos recorrentes por série.";
                    return false;
                }

                currentDate = currentDate.AddMonths(1);
            }

            return true;
        }

        private static Transaction BuildTransactionEntity(
            TransactionRequest dto,
            int userId,
            DateTime date,
            string? recurrenceGroupId)
        {
            return new Transaction
            {
                Description = dto.Description.Trim(),
                Category = dto.Category.Trim(),
                AmountCents = dto.AmountCents,
                Date = date,
                Type = dto.Type.Trim().ToLowerInvariant(),
                IsRecurring = dto.IsRecurring,
                RecurrenceEndDate = dto.IsRecurring ? dto.RecurrenceEndDate?.Date : null,
                RecurrenceGroupId = recurrenceGroupId,
                UserId = userId
            };
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
                Type = transaction.Type,
                IsRecurring = transaction.IsRecurring,
                RecurrenceEndDate = transaction.RecurrenceEndDate,
                RecurrenceGroupId = transaction.RecurrenceGroupId
            };
        }
    }
}
