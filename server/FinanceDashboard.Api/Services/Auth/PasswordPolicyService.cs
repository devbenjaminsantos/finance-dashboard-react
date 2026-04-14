using System.Text.RegularExpressions;

namespace FinanceDashboard.Api.Services.Auth
{
    public class PasswordPolicyService
    {
        private static readonly Regex UppercaseRegex = new("[A-Z]", RegexOptions.Compiled);
        private static readonly Regex LowercaseRegex = new("[a-z]", RegexOptions.Compiled);
        private static readonly Regex DigitRegex = new(@"\d", RegexOptions.Compiled);
        private static readonly Regex SpecialCharRegex = new(@"[^A-Za-z0-9]", RegexOptions.Compiled);

        public const string DefaultMessage =
            "A senha deve ter pelo menos 10 caracteres e incluir letra maiúscula, letra minúscula, número e símbolo.";

        public bool IsValid(string? password)
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                return false;
            }

            return password.Length >= 10 &&
                   UppercaseRegex.IsMatch(password) &&
                   LowercaseRegex.IsMatch(password) &&
                   DigitRegex.IsMatch(password) &&
                   SpecialCharRegex.IsMatch(password);
        }
    }
}
