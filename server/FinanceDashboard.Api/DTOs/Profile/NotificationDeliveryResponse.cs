namespace FinanceDashboard.Api.DTOs
{
    public class NotificationDeliveryResponse
    {
        public int Id { get; set; }
        public string NotificationType { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string ReferenceKey { get; set; } = string.Empty;
        public DateTime SentAtUtc { get; set; }
    }
}
