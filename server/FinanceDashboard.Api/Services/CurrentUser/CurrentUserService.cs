using System.Security.Claims;

namespace FinanceDashboard.Api.Services.CurrentUser
{
    public class CurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int GetRequiredUserId()
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(claim, out var userId))
            {
                throw new UnauthorizedAccessException("Usuario nao autenticado.");
            }

            return userId;
        }
    }
}
