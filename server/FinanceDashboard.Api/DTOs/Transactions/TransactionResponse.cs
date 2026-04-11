namespace FinanceDashboard.Api.DTOs
{
    public class TransactionResponse
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty;
        public bool IsRecurring { get; set; }
        public DateTime? RecurrenceEndDate { get; set; }
        public string? RecurrenceGroupId { get; set; }
    }
}
