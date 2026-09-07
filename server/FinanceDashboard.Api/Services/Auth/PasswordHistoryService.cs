using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Services.Auth;

public static class PasswordHistoryService
{
    public static async Task<bool> WasUsedAsync(
        AppDbContext context, PasswordHasher hasher, User user, string password)
    {
        if (hasher.VerifyPassword(user, password)) return true;

        var hashes = await context.PasswordHistory.AsNoTracking()
            .Where(entry => entry.UserId == user.Id)
            .Select(entry => entry.PasswordHash).ToListAsync();
        return hashes.Any(hash => hasher.VerifyPasswordHash(user, hash, password));
    }

    public static void ArchiveCurrent(AppDbContext context, User user)
    {
        context.PasswordHistory.Add(new PasswordHistory
        {
            UserId = user.Id,
            PasswordHash = user.PasswordHash
        });
    }
}
