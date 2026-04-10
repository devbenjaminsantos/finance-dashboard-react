using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs.BudgetGoals
{
    public abstract class BudgetGoalRequest
    {
        [Required]
        [RegularExpression(@"^\d{4}-(0[1-9]|1[0-2])$")]
        public string Month { get; set; } = string.Empty;

        [StringLength(60, MinimumLength = 2)]
        public string? Category { get; set; }

        [Range(1, long.MaxValue)]
        public long AmountCents { get; set; }
    }
}
