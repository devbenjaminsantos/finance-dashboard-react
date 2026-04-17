namespace FinanceDashboard.Api.Configuration
{
    public class NotificationOptions
    {
        public const string SectionName = "Notifications";

        public bool Enabled { get; set; } = true;
        public int ProcessingIntervalMinutes { get; set; } = 60;
    }
}
