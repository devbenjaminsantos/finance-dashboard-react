namespace FinanceDashboard.Api.Models
{
    public class FinancialAccount
    {
        public int Id { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string InstitutionName { get; set; } = string.Empty;
        public string? InstitutionCode { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string? AccountMask { get; set; }
        public string? ExternalAccountId { get; set; }
        public string? ProviderItemId { get; set; }
        public string Status { get; set; } = "disconnected";
        public DateTime? LastSyncedAtUtc { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
