using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Auth;
using FinanceDashboard.Api.Services.Email;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher _passwordHasher;
        private readonly JwTokenService _tokenService;
        private readonly PasswordResetTokenService _passwordResetTokenService;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            AppDbContext context,
            PasswordHasher passwordHasher,
            JwTokenService tokenService,
            PasswordResetTokenService passwordResetTokenService,
            IEmailSender emailSender,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<AuthController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _passwordResetTokenService = passwordResetTokenService;
            _emailSender = emailSender;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthUserResponse>> Register(RegisterRequest dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var emailAlreadyExists = await _context.Users
                .AnyAsync(user => user.Email == normalizedEmail);

            if (emailAlreadyExists)
            {
                return Conflict(new ProblemDetails
                {
                    Title = "E-mail já cadastrado.",
                    Status = StatusCodes.Status409Conflict
                });
            }

            var user = new User
            {
                Name = dto.Name.Trim(),
                Email = normalizedEmail
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException exception) when (IsDuplicateEmailViolation(exception))
            {
                return Conflict(new ProblemDetails
                {
                    Title = "E-mail já cadastrado.",
                    Status = StatusCodes.Status409Conflict
                });
            }

            return StatusCode(StatusCodes.Status201Created, ToAuthUserResponse(user));
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == normalizedEmail);

            if (user == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Usuário não encontrado.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            if (!_passwordHasher.VerifyPassword(user, dto.Password))
            {
                return Unauthorized(new ProblemDetails
                {
                    Title = "Senha incorreta.",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            return Ok(ToAuthResponse(user));
        }

        [HttpPost("demo-login")]
        public async Task<ActionResult<AuthResponse>> DemoLogin()
        {
            if (!_configuration.GetValue("Demo:Enabled", true))
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Conta demo indisponível.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            var demoEmail = _configuration["Demo:Email"] ?? "demo@finova.app";
            var normalizedEmail = demoEmail.Trim().ToLowerInvariant();

            var user = await _context.Users
                .Include(existing => existing.Transactions)
                .FirstOrDefaultAsync(existing => existing.Email == normalizedEmail);

            if (user is null)
            {
                user = new User
                {
                    Name = "Conta Demo",
                    Email = normalizedEmail
                };
                user.PasswordHash = _passwordHasher.HashPassword(
                    user,
                    _configuration["Demo:Password"] ?? "FinovaDemo@2026");

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            if (!user.Transactions.Any())
            {
                SeedDemoTransactions(user.Id);
                await _context.SaveChangesAsync();
            }

            return Ok(ToAuthResponse(user));
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword(ForgotPasswordRequest dto)
        {
            var response = new ForgotPasswordResponse
            {
                Message = "Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição."
            };

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(existing => existing.Email == normalizedEmail);

            if (user is null)
            {
                return Ok(response);
            }

            var now = DateTime.UtcNow;
            var activeTokens = await _context.PasswordResetTokens
                .Where(token => token.UserId == user.Id && token.UsedAtUtc == null && token.ExpiresAtUtc > now)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.UsedAtUtc = now;
            }

            var rawToken = _passwordResetTokenService.GenerateToken();
            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = _passwordResetTokenService.HashToken(rawToken),
                CreatedAtUtc = now,
                ExpiresAtUtc = now.AddMinutes(30)
            };

            _context.PasswordResetTokens.Add(resetToken);
            await _context.SaveChangesAsync();

            var resetUrl = BuildResetUrl(rawToken);

            try
            {
                await _emailSender.SendPasswordResetEmailAsync(user.Email, user.Name, resetUrl);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Não foi possível enviar e-mail de redefinição de senha.");
            }

            if (_environment.IsDevelopment() || _configuration.GetValue("PasswordReset:ExposeResetUrlInResponse", false))
            {
                response.ResetUrl = resetUrl;
            }

            return Ok(response);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest dto)
        {
            var tokenHash = _passwordResetTokenService.HashToken(dto.Token);
            var now = DateTime.UtcNow;

            var resetToken = await _context.PasswordResetTokens
                .Include(token => token.User)
                .FirstOrDefaultAsync(token =>
                    token.TokenHash == tokenHash &&
                    token.UsedAtUtc == null &&
                    token.ExpiresAtUtc > now);

            if (resetToken is null)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Link de redefinição inválido ou expirado.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            if (dto.NewPassword.Length < 6)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "A nova senha deve ter pelo menos 6 caracteres.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            resetToken.User.PasswordHash = _passwordHasher.HashPassword(resetToken.User, dto.NewPassword);
            resetToken.UsedAtUtc = now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Senha redefinida com sucesso." });
        }

        private AuthResponse ToAuthResponse(User user)
        {
            return new AuthResponse
            {
                Token = _tokenService.GenerateToken(user),
                User = ToAuthUserResponse(user)
            };
        }

        private static AuthUserResponse ToAuthUserResponse(User user)
        {
            return new AuthUserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email
            };
        }

        private static bool IsDuplicateEmailViolation(DbUpdateException exception)
        {
            return exception.InnerException is SqlException { Number: 2601 or 2627 };
        }

        private string BuildResetUrl(string token)
        {
            var configuredBaseUrl = _configuration["Client:BaseUrl"]?.TrimEnd('/');
            var requestOrigin = Request.Headers.Origin.FirstOrDefault()?.TrimEnd('/');
            var baseUrl = !string.IsNullOrWhiteSpace(configuredBaseUrl)
                ? configuredBaseUrl
                : requestOrigin ?? "http://localhost:5173";

            return $"{baseUrl}/reset-password?token={Uri.EscapeDataString(token)}";
        }

        private void SeedDemoTransactions(int userId)
        {
            var today = DateTime.UtcNow.Date;

            _context.Transactions.AddRange(
                new Transaction
                {
                    UserId = userId,
                    Description = "Salário",
                    Category = "Receita fixa",
                    AmountCents = 720000,
                    Date = today.AddDays(-5),
                    Type = "income"
                },
                new Transaction
                {
                    UserId = userId,
                    Description = "Mercado do mês",
                    Category = "Alimentação",
                    AmountCents = 86540,
                    Date = today.AddDays(-4),
                    Type = "expense"
                },
                new Transaction
                {
                    UserId = userId,
                    Description = "Aluguel",
                    Category = "Moradia",
                    AmountCents = 180000,
                    Date = today.AddDays(-3),
                    Type = "expense"
                },
                new Transaction
                {
                    UserId = userId,
                    Description = "Freelance dashboard",
                    Category = "Receita extra",
                    AmountCents = 125000,
                    Date = today.AddDays(-2),
                    Type = "income"
                },
                new Transaction
                {
                    UserId = userId,
                    Description = "Assinaturas digitais",
                    Category = "Assinaturas",
                    AmountCents = 8990,
                    Date = today.AddDays(-1),
                    Type = "expense"
                });
        }
    }
}
