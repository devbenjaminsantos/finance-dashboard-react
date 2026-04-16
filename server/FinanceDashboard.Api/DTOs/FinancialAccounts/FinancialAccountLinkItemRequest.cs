using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class FinancialAccountLinkItemRequest
    {
        [Required]
        [StringLength(120, MinimumLength = 3)]
        public string ItemId { get; set; } = string.Empty;

        [StringLength(120)]
        public string? InstitutionName { get; set; }

        [StringLength(120)]
        public string? AccountName { get; set; }

        [StringLength(32)]
        public string? AccountMask { get; set; }
    }
}
