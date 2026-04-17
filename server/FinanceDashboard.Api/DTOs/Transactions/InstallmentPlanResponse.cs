namespace FinanceDashboard.Api.DTOs
{
    public class InstallmentPlanResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountPerInstallmentCents { get; set; }
        public int InstallmentCount { get; set; }
        public int PostedInstallments { get; set; }
        public int RemainingInstallments { get; set; }
        public int UpcomingInstallments { get; set; }
        public long TotalAmountCents { get; set; }
        public long PaidAmountCents { get; set; }
        public long RemainingAmountCents { get; set; }
        public DateTime? NextInstallmentDate { get; set; }
        public int? NextInstallmentIndex { get; set; }
        public IReadOnlyList<string> TagNames { get; set; } = Array.Empty<string>();
    }
}
