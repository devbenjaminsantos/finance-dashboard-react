namespace FinanceDashboard.Api.DTOs
{
    public class TransactionUpdateRequest
    {
        public string Description { get; set; } = "";
        public string Category { get; set; } = "";
        public long AmountCents { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = "";
    }
}