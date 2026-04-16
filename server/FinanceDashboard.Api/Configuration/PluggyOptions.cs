namespace FinanceDashboard.Api.Configuration
{
    public class PluggyOptions
    {
        public const string SectionName = "Pluggy";

        public string BaseUrl { get; set; } = "https://api.pluggy.ai";
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }
}
