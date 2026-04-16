namespace FinanceDashboard.Api.Models
{
    public class TransactionTag
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<TransactionTagLink> TransactionLinks { get; set; } = new List<TransactionTagLink>();
    }
}
