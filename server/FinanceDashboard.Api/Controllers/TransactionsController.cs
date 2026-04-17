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
                .Include(transaction => transaction.TagLinks)
                .ThenInclude(link => link.TransactionTag)
                .Where(transaction => transaction.UserId == userId)
                .OrderByDescending(transaction => transaction.Date)
                .ToListAsync();

            return Ok(transactions.Select(ToResponse).ToList());
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TransactionResponse>> GetById(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var transaction = await _context.Transactions
                .Include(existing => existing.TagLinks)
                .ThenInclude(link => link.TransactionTag)
                .FirstOrDefaultAsync(transaction => transaction.Id == id && transaction.UserId == userId);

            if (transaction is null)
            {
                return NotFound();
            }

            return Ok(ToResponse(transaction));
        }

        [HttpPost]
        public async Task<ActionResult<TransactionResponse>> Create(TransactionCreateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();

            if (!TryBuildCreationPlan(dto, out var creationPlan, out var validationError))
            {
                ModelState.AddModelError(nameof(dto.InstallmentCount), validationError);
                return ValidationProblem(ModelState);
            }

            var transactions = creationPlan
                .Select(item => BuildTransactionEntity(
                    dto,
                    userId,
                    item.Date,
                    item.RecurrenceGroupId,
                    item.InstallmentIndex,
                    item.InstallmentCount,
                    item.InstallmentGroupId,
                    source: "manual",
                    importedAtUtc: null))
                .ToList();

            _context.Transactions.AddRange(transactions);
            await AttachTagsAsync(transactions, dto.TagNames, userId);
            await _context.SaveChangesAsync();

            var firstTransaction = transactions[0];
            var summary = dto.InstallmentCount > 1
                ? $"Compra parcelada criada: {firstTransaction.Description} ({dto.InstallmentCount} parcelas mensais)."
                : dto.IsRecurring
                ? $"Serie recorrente criada: {firstTransaction.Description} ({transactions.Count} lancamentos mensais)."
                : $"Transacao criada: {firstTransaction.Description} ({firstTransaction.Type}).";

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
                ModelState.AddModelError(nameof(dto.Transactions), "Limite de 500 transacoes por importacao.");
                return ValidationProblem(ModelState);
            }

            var source = dto.ImportFormat?.Trim().ToLowerInvariant() switch
            {
                "ofx" => "import_ofx",
                _ => "import_csv"
            };

            var importedAtUtc = DateTime.UtcNow;
            var transactions = new List<Transaction>();

            for (var index = 0; index < dto.Transactions.Count; index += 1)
            {
                var item = dto.Transactions[index];

                if (item.IsRecurring)
                {
                    ModelState.AddModelError(
                        $"{nameof(dto.Transactions)}[{index}].{nameof(item.IsRecurring)}",
                        "A importacao inicial de arquivo nao aceita recorrencia automatica.");
                    return ValidationProblem(ModelState);
                }

                transactions.Add(BuildTransactionEntity(
                    item,
                    userId,
                    item.Date.Date,
                    recurrenceGroupId: null,
                    installmentIndex: null,
                    installmentCount: null,
                    installmentGroupId: null,
                    source: source,
                    importedAtUtc: importedAtUtc));
            }

            _context.Transactions.AddRange(transactions);
            for (var index = 0; index < transactions.Count; index += 1)
            {
                await AttachTagsAsync(new[] { transactions[index] }, dto.Transactions[index].TagNames, userId);
            }
            await _context.SaveChangesAsync();

            await _auditLogService.WriteAsync(
                action: "transaction.imported",
                entityType: "Transaction",
                entityId: transactions[0].Id.ToString(),
                userId: userId,
                summary: $"Importacao {dto.ImportFormat?.ToUpperInvariant() ?? "CSV"} concluida com {transactions.Count} transacoes.");

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
            await ReplaceTagsAsync(transaction, dto.TagNames, userId);

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

        [HttpDelete("installment-groups/{installmentGroupId}")]
        public async Task<IActionResult> DeleteInstallmentGroup(string installmentGroupId)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var normalizedGroupId = installmentGroupId?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedGroupId))
            {
                return BadRequest();
            }

            var transactions = await _context.Transactions
                .Where(existing =>
                    existing.UserId == userId &&
                    existing.InstallmentGroupId == normalizedGroupId)
                .ToListAsync();

            if (transactions.Count == 0)
            {
                return NotFound();
            }

            var firstTransaction = transactions
                .OrderBy(existing => existing.InstallmentIndex ?? int.MaxValue)
                .First();

            _context.Transactions.RemoveRange(transactions);
            await _context.SaveChangesAsync();

            await _auditLogService.WriteAsync(
                action: "transaction.installment-group.deleted",
                entityType: "Transaction",
                entityId: normalizedGroupId,
                userId: userId,
                summary: $"Compra parcelada removida: {firstTransaction.Description} ({transactions.Count} parcelas).");

            return NoContent();
        }

        [HttpPut("installment-groups/{installmentGroupId}")]
        public async Task<IActionResult> UpdateInstallmentGroup(
            string installmentGroupId,
            InstallmentGroupUpdateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var normalizedGroupId = installmentGroupId?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedGroupId))
            {
                return BadRequest();
            }

            var transactions = await _context.Transactions
                .Where(existing =>
                    existing.UserId == userId &&
                    existing.InstallmentGroupId == normalizedGroupId)
                .ToListAsync();

            if (transactions.Count == 0)
            {
                return NotFound();
            }

            foreach (var transaction in transactions)
            {
                transaction.Description = dto.Description.Trim();
                transaction.Category = dto.Category.Trim();
            }

            foreach (var transaction in transactions)
            {
                await ReplaceTagsAsync(transaction, dto.TagNames, userId);
            }

            await _context.SaveChangesAsync();

            await _auditLogService.WriteAsync(
                action: "transaction.installment-group.updated",
                entityType: "Transaction",
                entityId: normalizedGroupId,
                userId: userId,
                summary: $"Compra parcelada atualizada: {dto.Description.Trim()} ({transactions.Count} parcelas).");

            return Ok(new
            {
                installmentGroupId = normalizedGroupId,
                updatedCount = transactions.Count
            });
        }

        private static bool TryBuildCreationPlan(
            TransactionRequest dto,
            out List<TransactionCreationItem> creationPlan,
            out string validationError)
        {
            creationPlan = new List<TransactionCreationItem>();
            validationError = string.Empty;

            var startDate = dto.Date.Date;
            var installmentCount = Math.Max(1, dto.InstallmentCount);

            if (dto.IsRecurring && installmentCount > 1)
            {
                validationError = "Escolha recorrencia mensal ou parcelamento, nao os dois ao mesmo tempo.";
                return false;
            }

            if (installmentCount > 1)
            {
                if (dto.Type != "expense")
                {
                    validationError = "Parcelamento esta disponivel apenas para despesas nesta etapa.";
                    return false;
                }

                var installmentGroupId = Guid.NewGuid().ToString("N");

                for (var installmentIndex = 1; installmentIndex <= installmentCount; installmentIndex += 1)
                {
                    creationPlan.Add(new TransactionCreationItem
                    {
                        Date = startDate.AddMonths(installmentIndex - 1),
                        InstallmentIndex = installmentIndex,
                        InstallmentCount = installmentCount,
                        InstallmentGroupId = installmentGroupId
                    });
                }

                return true;
            }

            if (!dto.IsRecurring)
            {
                creationPlan.Add(new TransactionCreationItem
                {
                    Date = startDate
                });
                return true;
            }

            if (!dto.RecurrenceEndDate.HasValue)
            {
                validationError = "Informe ate quando a recorrencia mensal deve ser gerada.";
                return false;
            }

            var endDate = dto.RecurrenceEndDate.Value.Date;
            var minimumEndDate = startDate.AddMonths(1);

            if (endDate < minimumEndDate)
            {
                validationError = "A recorrencia mensal precisa alcancar pelo menos o proximo mes.";
                return false;
            }

            var currentDate = startDate;
            var recurrenceGroupId = Guid.NewGuid().ToString("N");

            while (currentDate <= endDate)
            {
                creationPlan.Add(new TransactionCreationItem
                {
                    Date = currentDate,
                    RecurrenceGroupId = recurrenceGroupId
                });

                if (creationPlan.Count > 60)
                {
                    validationError = "Limite de 60 lancamentos recorrentes por serie.";
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
            string? recurrenceGroupId,
            int? installmentIndex,
            int? installmentCount,
            string? installmentGroupId,
            string source,
            DateTime? importedAtUtc)
        {
            return new Transaction
            {
                Description = dto.Description.Trim(),
                Category = dto.Category.Trim(),
                AmountCents = dto.AmountCents,
                Date = date,
                Type = dto.Type.Trim().ToLowerInvariant(),
                Source = source,
                SourceReference = dto is TransactionImportItemRequest importItem
                    ? importItem.SourceReference?.Trim()
                    : null,
                ImportedAtUtc = importedAtUtc,
                IsRecurring = dto.IsRecurring,
                RecurrenceEndDate = dto.IsRecurring ? dto.RecurrenceEndDate?.Date : null,
                RecurrenceGroupId = recurrenceGroupId,
                InstallmentIndex = installmentIndex,
                InstallmentCount = installmentCount,
                InstallmentGroupId = installmentGroupId,
                UserId = userId
            };
        }

        private async Task AttachTagsAsync(
            IEnumerable<Transaction> transactions,
            IEnumerable<string>? rawTagNames,
            int userId)
        {
            var normalizedTagNames = NormalizeTagNames(rawTagNames);

            if (normalizedTagNames.Count == 0)
            {
                return;
            }

            var existingTags = await _context.TransactionTags
                .Where(tag => tag.UserId == userId && normalizedTagNames.Contains(tag.Name))
                .ToListAsync();

            var existingNames = existingTags
                .Select(tag => tag.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var newTags = normalizedTagNames
                .Where(name => !existingNames.Contains(name))
                .Select(name => new TransactionTag
                {
                    Name = name,
                    UserId = userId
                })
                .ToList();

            if (newTags.Count > 0)
            {
                _context.TransactionTags.AddRange(newTags);
                existingTags.AddRange(newTags);
            }

            var tagsByName = existingTags.ToDictionary(tag => tag.Name, StringComparer.OrdinalIgnoreCase);

            foreach (var transaction in transactions)
            {
                foreach (var tagName in normalizedTagNames)
                {
                    if (!tagsByName.TryGetValue(tagName, out var tag))
                    {
                        continue;
                    }

                    transaction.TagLinks.Add(new TransactionTagLink
                    {
                        Transaction = transaction,
                        TransactionTag = tag
                    });
                }
            }
        }

        private async Task ReplaceTagsAsync(Transaction transaction, IEnumerable<string>? rawTagNames, int userId)
        {
            await _context.Entry(transaction)
                .Collection(existing => existing.TagLinks)
                .Query()
                .Include(link => link.TransactionTag)
                .LoadAsync();

            _context.TransactionTagLinks.RemoveRange(transaction.TagLinks);
            transaction.TagLinks.Clear();

            await AttachTagsAsync(new[] { transaction }, rawTagNames, userId);
        }

        private static List<string> NormalizeTagNames(IEnumerable<string>? rawTagNames)
        {
            return (rawTagNames ?? Array.Empty<string>())
                .Select(name => name?.Trim() ?? string.Empty)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name.Length > 40 ? name[..40] : name)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(name => name)
                .ToList();
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
                Source = transaction.Source,
                SourceReference = transaction.SourceReference,
                ImportedAtUtc = transaction.ImportedAtUtc,
                FinancialAccountId = transaction.FinancialAccountId,
                TagNames = transaction.TagLinks
                    .Select(link => link.TransactionTag.Name)
                    .OrderBy(name => name)
                    .ToList(),
                IsRecurring = transaction.IsRecurring,
                RecurrenceEndDate = transaction.RecurrenceEndDate,
                RecurrenceGroupId = transaction.RecurrenceGroupId,
                InstallmentIndex = transaction.InstallmentIndex,
                InstallmentCount = transaction.InstallmentCount,
                InstallmentGroupId = transaction.InstallmentGroupId
            };
        }

        private sealed class TransactionCreationItem
        {
            public DateTime Date { get; set; }
            public string? RecurrenceGroupId { get; set; }
            public int? InstallmentIndex { get; set; }
            public int? InstallmentCount { get; set; }
            public string? InstallmentGroupId { get; set; }
        }
    }
}
