using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public abstract class TransactionRequest
    {
        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(60, MinimumLength = 2)]
        public string Category { get; set; } = string.Empty;

        [Range(1, long.MaxValue)]
        public long AmountCents { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [RegularExpression("^(income|expense)$")]
        public string Type { get; set; } = string.Empty;
    }
}
