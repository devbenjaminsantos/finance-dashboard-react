namespace FinanceDashboard.Api.Services.Email
{
    using FinanceDashboard.Api.Services.Notifications;

    public interface IEmailSender
    {
        Task SendPasswordResetEmailAsync(string toEmail, string name, string resetUrl);
        Task SendEmailVerificationAsync(string toEmail, string name, string verificationUrl);
        Task SendBudgetGoalAlertEmailAsync(
            string toEmail,
            string name,
            string monthLabel,
            string goalLabel,
            int progressPercent,
            decimal spentAmount,
            decimal targetAmount);
        Task SendMonthlySummaryEmailAsync(
            string toEmail,
            string name,
            string monthLabel,
            decimal incomeAmount,
            decimal expenseAmount,
            decimal balanceAmount,
            string? topExpenseCategory,
            decimal? topExpenseAmount,
            IReadOnlyList<MonthlyGoalSummary> goalSummaries);
    }
}
