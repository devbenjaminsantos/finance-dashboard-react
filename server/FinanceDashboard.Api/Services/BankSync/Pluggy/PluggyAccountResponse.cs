using System.Text.Json.Serialization;

namespace FinanceDashboard.Api.Services.BankSync.Pluggy
{
    public class PluggyAccountResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("number")]
        public string? Number { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }
    }
}
