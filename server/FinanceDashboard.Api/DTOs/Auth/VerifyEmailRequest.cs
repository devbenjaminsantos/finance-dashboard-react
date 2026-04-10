using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class VerifyEmailRequest
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
}
