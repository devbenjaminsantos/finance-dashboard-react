using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.Models;

namespace FinanceDashboard.Api.Services.Audit
{
    public class AuditLogService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditLogService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task WriteAsync(
            string action,
            string entityType,
            string summary,
            int? userId = null,
            string? entityId = null)
        {
            var ipAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Summary = summary,
                IpAddress = ipAddress,
                CreatedAtUtc = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
    }
}
