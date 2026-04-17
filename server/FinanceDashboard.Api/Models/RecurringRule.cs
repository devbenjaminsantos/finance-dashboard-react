namespace FinanceDashboard.Api.Models
{
    public class RecurringRule
    {
        public int Id { get; set; }
        public string PublicId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }
        public string Type { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? LastGeneratedDate { get; set; }
        public DateTime? NextOccurrenceDate { get; set; }
        public bool IsActive { get; set; } = true;
        public string TagsCsv { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
