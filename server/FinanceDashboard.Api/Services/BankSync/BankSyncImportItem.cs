namespace FinanceDashboard.Api.Services.BankSync
{
    public class BankSyncImportItem
    {
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? SourceReference { get; set; }
    }
}
