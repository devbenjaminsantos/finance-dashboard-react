using FinanceDashboard.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace FinanceDashboard.Api.Services.Auth
{
    public class PasswordHasher
    {
        private readonly IPasswordHasher<User> _passwordHasher;

        public PasswordHasher(IPasswordHasher<User> passwordHasher)
        {
            _passwordHasher = passwordHasher;
        }

        public string HashPassword(User user, string password)
        {
            return _passwordHasher.HashPassword(user, password);
        }

        public bool VerifyPassword(User user, string providedPassword)
        {
            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, providedPassword);
            return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
        }
    }
}
