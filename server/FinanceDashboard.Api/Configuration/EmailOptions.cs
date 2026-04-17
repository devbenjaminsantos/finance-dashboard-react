namespace FinanceDashboard.Api.Configuration
{
    public class EmailOptions
    {
        public const string SectionName = "Email";

        public string Provider { get; set; } = "Smtp";
    }
}
