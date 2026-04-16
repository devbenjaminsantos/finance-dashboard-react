using System.Text.Json.Serialization;

namespace FinanceDashboard.Api.Services.BankSync.Pluggy
{
    public class PluggyConnectTokenResponse
    {
        [JsonPropertyName("accessToken")]
        public string AccessToken { get; set; } = string.Empty;
    }
}
