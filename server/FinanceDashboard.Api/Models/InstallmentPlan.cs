namespace FinanceDashboard.Api.Models
{
    public class InstallmentPlan
    {
        public int Id { get; set; }
        public string PublicId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountPerInstallmentCents { get; set; }
        public int InstallmentCount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
