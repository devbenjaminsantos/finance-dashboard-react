namespace FinanceDashboard.Api.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty; // income | expense
        public string Source { get; set; } = "manual";
        public string? SourceReference { get; set; }
        public DateTime? ImportedAtUtc { get; set; }
        public bool IsRecurring { get; set; }
        public DateTime? RecurrenceEndDate { get; set; }
        public string? RecurrenceGroupId { get; set; }
        public int? InstallmentIndex { get; set; }
        public int? InstallmentCount { get; set; }
        public string? InstallmentGroupId { get; set; }
        public int? InstallmentPlanId { get; set; }
        public InstallmentPlan? InstallmentPlan { get; set; }
        public int? FinancialAccountId { get; set; }
        public FinancialAccount? FinancialAccount { get; set; }
        public ICollection<TransactionTagLink> TagLinks { get; set; } = new List<TransactionTagLink>();

        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
