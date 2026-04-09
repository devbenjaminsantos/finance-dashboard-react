using System.Security.Cryptography;
using Microsoft.AspNetCore.WebUtilities;

namespace FinanceDashboard.Api.Services.Auth
{
    public class PasswordResetTokenService
    {
        public string GenerateToken()
        {
            return WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        }

        public string HashToken(string token)
        {
            var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes);
        }
    }
}
