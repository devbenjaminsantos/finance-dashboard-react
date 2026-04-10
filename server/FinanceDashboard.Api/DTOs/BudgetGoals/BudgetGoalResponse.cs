namespace FinanceDashboard.Api.DTOs.BudgetGoals
{
    public class BudgetGoalResponse
    {
        public int Id { get; set; }
        public string Month { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }
    }
}
