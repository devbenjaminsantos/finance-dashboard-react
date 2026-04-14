using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class TransactionImportRequest
    {
        [Required]
        [MinLength(1)]
        public List<TransactionImportItemRequest> Transactions { get; set; } = new();
    }
}
