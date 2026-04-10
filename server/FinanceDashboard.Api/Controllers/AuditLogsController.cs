using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs.Audit;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CurrentUserService _currentUserService;

        public AuditLogsController(AppDbContext context, CurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<AuditLogResponse>>> GetRecent([FromQuery] int limit = 50)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var safeLimit = Math.Clamp(limit, 1, 200);

            var logs = await _context.AuditLogs
                .AsNoTracking()
                .Where(log => log.UserId == userId)
                .OrderByDescending(log => log.CreatedAtUtc)
                .Take(safeLimit)
                .Select(log => new AuditLogResponse
                {
                    Id = log.Id,
                    Action = log.Action,
                    EntityType = log.EntityType,
                    EntityId = log.EntityId,
                    Summary = log.Summary,
                    IpAddress = log.IpAddress,
                    CreatedAtUtc = log.CreatedAtUtc
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
