using System.Text.Json.Serialization;

namespace FinanceDashboard.Api.Services.BankSync.Pluggy
{
    public class PluggyPagedResponse<T>
    {
        [JsonPropertyName("results")]
        public List<T> Results { get; set; } = new();

        [JsonPropertyName("totalPages")]
        public int TotalPages { get; set; }

        [JsonPropertyName("page")]
        public int Page { get; set; }
    }
}
