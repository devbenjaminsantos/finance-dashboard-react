namespace FinanceDashboard.Api.Models
{
    public class TransactionTagLink
    {
        public int TransactionId { get; set; }
        public Transaction Transaction { get; set; } = null!;

        public int TransactionTagId { get; set; }
        public TransactionTag TransactionTag { get; set; } = null!;
    }
}
