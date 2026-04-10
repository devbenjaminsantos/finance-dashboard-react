using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class ResendEmailVerificationRequest
    {
        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;
    }
}
