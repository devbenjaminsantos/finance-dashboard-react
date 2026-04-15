namespace FinanceDashboard.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public bool? OnboardingOptIn { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public int FailedLoginAttempts { get; set; }
        public DateTime? LockoutEndsAtUtc { get; set; }
        public DateTime? LastFailedLoginAtUtc { get; set; }

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        public ICollection<FinancialAccount> FinancialAccounts { get; set; } = new List<FinancialAccount>();
        public ICollection<BudgetGoal> BudgetGoals { get; set; } = new List<BudgetGoal>();
        public ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = new List<EmailVerificationToken>();
        public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }
}
