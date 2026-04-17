namespace FinanceDashboard.Api.Configuration
{
    public class AzureCommunicationServicesEmailOptions
    {
        public const string SectionName = "AzureCommunicationServices:Email";

        public string ConnectionString { get; set; } = string.Empty;
        public string SenderAddress { get; set; } = string.Empty;
        public string SenderName { get; set; } = "Finova";
    }
}
