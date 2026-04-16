using FinanceDashboard.Api.Models;

namespace FinanceDashboard.Api.Services.BankSync
{
    public interface IBankSyncProvider
    {
        bool CanHandle(FinancialAccount account);
        Task<BankSyncResult> FetchTransactionsAsync(FinancialAccount account, CancellationToken cancellationToken = default);
    }
}
