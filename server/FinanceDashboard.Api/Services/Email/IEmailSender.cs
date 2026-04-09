namespace FinanceDashboard.Api.Services.Email
{
    public interface IEmailSender
    {
        Task SendPasswordResetEmailAsync(string toEmail, string name, string resetUrl);
    }
}
