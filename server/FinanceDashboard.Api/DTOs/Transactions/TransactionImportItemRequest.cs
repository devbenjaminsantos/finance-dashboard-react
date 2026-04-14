using System.ComponentModel.DataAnnotations;

namespace FinanceDashboard.Api.DTOs
{
    public class TransactionImportItemRequest : TransactionRequest
    {
        [StringLength(120)]
        public string? SourceReference { get; set; }
    }
}
