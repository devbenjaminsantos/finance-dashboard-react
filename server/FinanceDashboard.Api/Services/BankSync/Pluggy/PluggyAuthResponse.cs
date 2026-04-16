using System.Text.Json.Serialization;

namespace FinanceDashboard.Api.Services.BankSync.Pluggy
{
    public class PluggyAuthResponse
    {
        [JsonPropertyName("apiKey")]
        public string ApiKey { get; set; } = string.Empty;
    }
}
