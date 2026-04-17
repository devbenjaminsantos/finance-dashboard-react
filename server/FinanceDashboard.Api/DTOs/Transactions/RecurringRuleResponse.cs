namespace FinanceDashboard.Api.DTOs
{
    public class RecurringRuleResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }
        public string Type { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? NextOccurrenceDate { get; set; }
        public DateTime? LastGeneratedDate { get; set; }
        public bool IsActive { get; set; }
        public IReadOnlyList<string> TagNames { get; set; } = Array.Empty<string>();
    }
}
