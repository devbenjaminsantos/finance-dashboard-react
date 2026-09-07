namespace FinanceDashboard.Api.Models;

public sealed class PasswordHistory
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string PasswordHash { get; set; } = string.Empty;
}
