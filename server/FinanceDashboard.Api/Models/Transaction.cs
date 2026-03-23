namespace FinanceDashboard.Api.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty; // income | expense

        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}