using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Audit;
using FinanceDashboard.Api.Services.BankSync;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FinancialAccountsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CurrentUserService _currentUserService;
        private readonly AuditLogService _auditLogService;
        private readonly BankSyncService _bankSyncService;

        public FinancialAccountsController(
            AppDbContext context,
            CurrentUserService currentUserService,
            AuditLogService auditLogService,
            BankSyncService bankSyncService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditLogService = auditLogService;
            _bankSyncService = bankSyncService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<FinancialAccountResponse>>> GetAll()
        {
            var userId = _currentUserService.GetRequiredUserId();

            var accounts = await _context.FinancialAccounts
                .Where(account => account.UserId == userId)
                .OrderBy(account => account.InstitutionName)
                .ThenBy(account => account.AccountName)
                .Select(account => ToResponse(account))
                .ToListAsync();

            return Ok(accounts);
        }

        [HttpPost]
        public async Task<ActionResult<FinancialAccountResponse>> Create(FinancialAccountCreateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var account = new FinancialAccount
            {
                Provider = dto.Provider.Trim().ToLowerInvariant(),
                InstitutionName = dto.InstitutionName.Trim(),
                InstitutionCode = dto.InstitutionCode?.Trim(),
                AccountName = dto.AccountName.Trim(),
                AccountMask = dto.AccountMask?.Trim(),
                ExternalAccountId = dto.ExternalAccountId?.Trim(),
                Status = "pending",
                UserId = userId
            };

            _context.FinancialAccounts.Add(account);
            await _context.SaveChangesAsync();

            await _auditLogService.WriteAsync(
                action: "financial-account.created",
                entityType: "FinancialAccount",
                entityId: account.Id.ToString(),
                userId: userId,
                summary: $"Conta financeira adicionada: {account.InstitutionName} - {account.AccountName}.");

            return CreatedAtAction(nameof(GetAll), new { id = account.Id }, ToResponse(account));
        }

        [HttpPost("{id:int}/sync")]
        public async Task<ActionResult<FinancialAccountSyncResponse>> Sync(int id, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var account = await _context.FinancialAccounts
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

            if (account is null)
            {
                return NotFound();
            }

            var result = await _bankSyncService.SyncAsync(account, cancellationToken);

            await _auditLogService.WriteAsync(
                action: "financial-account.synced",
                entityType: "FinancialAccount",
                entityId: account.Id.ToString(),
                userId: userId,
                summary: $"Sincronizacao executada para {account.InstitutionName} - {account.AccountName}: {result.ImportedCount} importadas, {result.SkippedCount} ignoradas.");

            return Ok(result);
        }

        private static FinancialAccountResponse ToResponse(FinancialAccount account)
        {
            return new FinancialAccountResponse
            {
                Id = account.Id,
                Provider = account.Provider,
                InstitutionName = account.InstitutionName,
                InstitutionCode = account.InstitutionCode,
                AccountName = account.AccountName,
                AccountMask = account.AccountMask,
                ExternalAccountId = account.ExternalAccountId,
                Status = account.Status,
                LastSyncedAtUtc = account.LastSyncedAtUtc
            };
        }
    }
}
