using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Auth;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
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

        public AuthController(
            AppDbContext context,
            PasswordHasher passwordHasher,
            JwTokenService tokenService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
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

            return Ok(new AuthResponse
            {
                Token = _tokenService.GenerateToken(user),
                User = ToAuthUserResponse(user)
            });
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
    }
}
