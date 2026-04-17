namespace FinanceDashboard.Api.Models
{
    public class NotificationDelivery
    {
        public int Id { get; set; }
        public string NotificationType { get; set; } = string.Empty;
        public string ReferenceKey { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public DateTime SentAtUtc { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
