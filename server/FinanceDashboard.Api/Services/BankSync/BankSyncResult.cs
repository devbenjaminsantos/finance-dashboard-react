namespace FinanceDashboard.Api.Services.BankSync
{
    public class BankSyncResult
    {
        public List<BankSyncImportItem> Items { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }
}
