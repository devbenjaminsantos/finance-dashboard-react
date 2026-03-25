namespace FinanceDashboard.Api.DTOs
{
    public class TransactionUpdateRequest
    {
        public string Title { get; set; } = "";
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = "";
    }
}