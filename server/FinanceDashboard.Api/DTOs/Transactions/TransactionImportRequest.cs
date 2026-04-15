using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class TransactionImportRequest
    {
        [RegularExpression("^(csv|ofx)$")]
        public string? ImportFormat { get; set; }

        [Required]
        [MinLength(1)]
        public List<TransactionImportItemRequest> Transactions { get; set; } = new();
    }
}
