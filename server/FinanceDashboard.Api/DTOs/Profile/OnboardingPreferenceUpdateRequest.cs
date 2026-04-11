using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class OnboardingPreferenceUpdateRequest
    {
        [Required]
        public bool? OnboardingOptIn { get; set; }
    }
}
