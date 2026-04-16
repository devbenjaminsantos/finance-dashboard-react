using System.Text.Json.Serialization;

namespace FinanceDashboard.Api.Services.BankSync.Pluggy
{
    public class PluggyTransactionResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("date")]
        public DateTime Date { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("paymentData")]
        public PluggyPaymentDataResponse? PaymentData { get; set; }
    }

    public class PluggyPaymentDataResponse
    {
        [JsonPropertyName("payer")]
        public PluggyPaymentParticipantResponse? Payer { get; set; }

        [JsonPropertyName("receiver")]
        public PluggyPaymentParticipantResponse? Receiver { get; set; }
    }

    public class PluggyPaymentParticipantResponse
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
