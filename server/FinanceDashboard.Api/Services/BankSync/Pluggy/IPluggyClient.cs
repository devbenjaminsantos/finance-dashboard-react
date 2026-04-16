namespace FinanceDashboard.Api.Services.BankSync.Pluggy
{
    public interface IPluggyClient
    {
        bool IsConfigured { get; }
        Task<string> CreateConnectTokenAsync(string clientUserId, string? itemId, CancellationToken cancellationToken = default);
        Task<PluggyItemResponse> GetItemAsync(string itemId, CancellationToken cancellationToken = default);
        Task<List<PluggyAccountResponse>> GetAccountsAsync(string itemId, CancellationToken cancellationToken = default);
        Task<List<PluggyTransactionResponse>> GetTransactionsAsync(string accountId, DateTime from, CancellationToken cancellationToken = default);
        Task UpdateItemAsync(string itemId, CancellationToken cancellationToken = default);
    }
}
