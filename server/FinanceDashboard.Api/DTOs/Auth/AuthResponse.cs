namespace FinanceDashboard.Api.DTOs
{
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public AuthUserResponse User { get; set; } = new();
    }

    public class AuthUserResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsDemo { get; set; }
        public bool? OnboardingOptIn { get; set; }
    }
}
