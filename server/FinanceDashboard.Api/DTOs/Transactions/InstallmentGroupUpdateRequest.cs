using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class InstallmentGroupUpdateRequest
    {
        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(60, MinimumLength = 2)]
        public string Category { get; set; } = string.Empty;

        public List<string> TagNames { get; set; } = new();
    }
}
