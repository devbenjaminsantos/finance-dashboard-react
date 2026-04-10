namespace FinanceDashboard.Api.Models
{
    public class EmailVerificationToken
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime? UsedAtUtc { get; set; }

        public User User { get; set; } = null!;
    }
}
