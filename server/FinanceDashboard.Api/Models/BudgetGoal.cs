namespace FinanceDashboard.Api.Models
{
    public class BudgetGoal
    {
        public int Id { get; set; }
        public string Month { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long AmountCents { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
