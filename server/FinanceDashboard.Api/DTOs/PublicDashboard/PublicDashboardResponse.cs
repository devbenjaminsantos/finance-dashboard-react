namespace FinanceDashboard.Api.DTOs.PublicDashboard
{
    public class PublicDashboardResponse
    {
        public string DisplayName { get; set; } = string.Empty;
        public DateTime? LastTransactionDate { get; set; }
        public IReadOnlyList<PublicDashboardTransactionResponse> Transactions { get; set; } =
            Array.Empty<PublicDashboardTransactionResponse>();
    }

    public class PublicDashboardTransactionResponse
    {
        public DateTime Date { get; set; }
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }
        public string Type { get; set; } = string.Empty;
        public bool IsRecurring { get; set; }
    }
}
