namespace FinanceDashboard.Api.DTOs
{
    public class FinancialAccountSyncResponse
    {
        public int FinancialAccountId { get; set; }
        public int ImportedCount { get; set; }
        public int SkippedCount { get; set; }
        public DateTime SyncedAtUtc { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
