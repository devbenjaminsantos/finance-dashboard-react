using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Auth;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CurrentUserService _currentUserService;
        private readonly PasswordHasher _passwordHasher;

        public ProfileController(
            AppDbContext context,
            CurrentUserService currentUserService,
            PasswordHasher passwordHasher)
        {
            _context = context;
            _currentUserService = currentUserService;
            _passwordHasher = passwordHasher;
        }

        [HttpGet]
        public async Task<ActionResult<AuthUserResponse>> Get()
        {
            var userId = _currentUserService.GetRequiredUserId();

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(existing => existing.Id == userId);

            if (user is null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Usuário não encontrado.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            return Ok(ToAuthUserResponse(user));
        }

        [HttpPut]
        public async Task<ActionResult<AuthUserResponse>> Update(ProfileUpdateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var user = await _context.Users
                .FirstOrDefaultAsync(existing => existing.Id == userId);

            if (user is null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Usuário não encontrado.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            var name = dto.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Informe um nome válido.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var wantsToChangePassword =
                !string.IsNullOrWhiteSpace(dto.CurrentPassword) ||
                !string.IsNullOrWhiteSpace(dto.NewPassword);

            if (wantsToChangePassword)
            {
                if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                {
                    return BadRequest(new ProblemDetails
                    {
                        Title = "Informe sua senha atual.",
                        Status = StatusCodes.Status400BadRequest
                    });
                }

                if (!_passwordHasher.VerifyPassword(user, dto.CurrentPassword))
                {
                    return Unauthorized(new ProblemDetails
                    {
                        Title = "Senha atual incorreta.",
                        Status = StatusCodes.Status401Unauthorized
                    });
                }

                if (string.IsNullOrWhiteSpace(dto.NewPassword))
                {
                    return BadRequest(new ProblemDetails
                    {
                        Title = "Informe uma nova senha.",
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

                user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            }

            user.Name = name;

            await _context.SaveChangesAsync();

            return Ok(ToAuthUserResponse(user));
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
    }
}
