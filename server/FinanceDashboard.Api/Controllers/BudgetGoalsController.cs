using System.Text.RegularExpressions;
using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs.BudgetGoals;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BudgetGoalsController : ControllerBase
    {
        private static readonly Regex MonthRegex = new(@"^\d{4}-(0[1-9]|1[0-2])$", RegexOptions.Compiled);

        private readonly AppDbContext _context;
        private readonly CurrentUserService _currentUserService;

        public BudgetGoalsController(AppDbContext context, CurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<BudgetGoalResponse>>> GetAll([FromQuery] string? month = null)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var normalizedMonth = NormalizeMonthOrThrow(month);

            var goals = await _context.BudgetGoals
                .Where(goal => goal.UserId == userId && goal.Month == normalizedMonth)
                .OrderBy(goal => string.IsNullOrEmpty(goal.Category) ? 0 : 1)
                .ThenBy(goal => goal.Category)
                .Select(goal => ToResponse(goal))
                .ToListAsync();

            return Ok(goals);
        }

        [HttpPost]
        public async Task<ActionResult<BudgetGoalResponse>> Create(BudgetGoalCreateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var month = NormalizeMonthOrThrow(dto.Month);
            var category = NormalizeCategory(dto.Category);

            var alreadyExists = await _context.BudgetGoals.AnyAsync(goal =>
                goal.UserId == userId &&
                goal.Month == month &&
                goal.Category == category);

            if (alreadyExists)
            {
                return Conflict(new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Ja existe uma meta para esta categoria neste mes."
                });
            }

            var goal = new BudgetGoal
            {
                Month = month,
                Category = category,
                AmountCents = dto.AmountCents,
                UserId = userId
            };

            _context.BudgetGoals.Add(goal);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { month = goal.Month }, ToResponse(goal));
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<BudgetGoalResponse>> Update(int id, BudgetGoalUpdateRequest dto)
        {
            var userId = _currentUserService.GetRequiredUserId();
            var month = NormalizeMonthOrThrow(dto.Month);
            var category = NormalizeCategory(dto.Category);

            var goal = await _context.BudgetGoals
                .FirstOrDefaultAsync(existing => existing.Id == id && existing.UserId == userId);

            if (goal is null)
            {
                return NotFound();
            }

            var alreadyExists = await _context.BudgetGoals.AnyAsync(existing =>
                existing.Id != id &&
                existing.UserId == userId &&
                existing.Month == month &&
                existing.Category == category);

            if (alreadyExists)
            {
                return Conflict(new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Ja existe uma meta para esta categoria neste mes."
                });
            }

            goal.Month = month;
            goal.Category = category;
            goal.AmountCents = dto.AmountCents;

            await _context.SaveChangesAsync();

            return Ok(ToResponse(goal));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = _currentUserService.GetRequiredUserId();

            var goal = await _context.BudgetGoals
                .FirstOrDefaultAsync(existing => existing.Id == id && existing.UserId == userId);

            if (goal is null)
            {
                return NotFound();
            }

            _context.BudgetGoals.Remove(goal);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static BudgetGoalResponse ToResponse(BudgetGoal goal)
        {
            return new BudgetGoalResponse
            {
                Id = goal.Id,
                Month = goal.Month,
                Category = goal.Category,
                AmountCents = goal.AmountCents
            };
        }

        private static string NormalizeMonthOrThrow(string? value)
        {
            var normalized = string.IsNullOrWhiteSpace(value)
                ? DateTime.UtcNow.ToString("yyyy-MM")
                : value.Trim();

            if (!MonthRegex.IsMatch(normalized))
            {
                throw new BadHttpRequestException("Informe um mes valido no formato yyyy-MM.");
            }

            return normalized;
        }

        private static string NormalizeCategory(string? category)
        {
            if (string.IsNullOrWhiteSpace(category))
            {
                return string.Empty;
            }

            return category.Trim();
        }
    }
}
