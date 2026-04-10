namespace FinanceDashboard.Api.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        public User? User { get; set; }
    }
}
