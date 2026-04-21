namespace FinanceDashboard.Api.DTOs
{
    public class FinancialAccountResponse
    {
        public int Id { get; set; }
        public string AccountType { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string InstitutionName { get; set; } = string.Empty;
        public string? InstitutionCode { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string? AccountMask { get; set; }
        public string? ExternalAccountId { get; set; }
        public string? ProviderItemId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? LastSyncedAtUtc { get; set; }
        public int LinkedTransactionsCount { get; set; }
    }
}
