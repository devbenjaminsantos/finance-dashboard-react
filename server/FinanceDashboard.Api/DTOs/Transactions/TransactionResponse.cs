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
        public string Source { get; set; } = string.Empty;
        public string? SourceReference { get; set; }
        public DateTime? ImportedAtUtc { get; set; }
        public int? FinancialAccountId { get; set; }
        public IReadOnlyList<string> TagNames { get; set; } = Array.Empty<string>();
        public bool IsRecurring { get; set; }
        public DateTime? RecurrenceEndDate { get; set; }
        public string? RecurrenceGroupId { get; set; }
        public int? InstallmentIndex { get; set; }
        public int? InstallmentCount { get; set; }
        public string? InstallmentGroupId { get; set; }
        public int? InstallmentPlanId { get; set; }
    }
}
