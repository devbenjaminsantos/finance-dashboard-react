namespace FinanceDashboard.Api.DTOs
{
    public class FinancialAccountConnectTokenResponse
    {
        public string ConnectToken { get; set; } = string.Empty;
        public bool IsSandboxEnabled { get; set; }
    }
}
