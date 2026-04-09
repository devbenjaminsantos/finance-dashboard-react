namespace FinanceDashboard.Api.DTOs
{
    public class ForgotPasswordResponse
    {
        public string Message { get; set; } = string.Empty;
        public string? ResetUrl { get; set; }
    }
}
