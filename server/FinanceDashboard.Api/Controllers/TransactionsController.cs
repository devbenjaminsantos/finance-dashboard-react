using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceDashboard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransactionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var userId = GetUserId();

            var transactions = _context.Transactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .ToList();

            return Ok(transactions);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var userId = GetUserId();

            var transaction = _context.Transactions
                .FirstOrDefault(t => t.Id == id && t.UserId == userId);

            if (transaction == null)
                return NotFound();

            return Ok(transaction);
        }

        [HttpPost]
        public IActionResult Create(TransactionCreateRequest dto)
        {
            var userId = GetUserId();

            var transaction = new Transaction
            {
                Description = dto.Description,
                Category = dto.Category,
                AmountCents = dto.AmountCents,
                Date = dto.Date,
                Type = dto.Type,
                UserId = userId
            };

            _context.Transactions.Add(transaction);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, transaction);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, TransactionUpdateRequest dto)
        {
            var userId = GetUserId();

            var transaction = _context.Transactions
                .FirstOrDefault(t => t.Id == id && t.UserId == userId);

            if (transaction == null)
                return NotFound();

                transaction.Description = dto.Description;
                transaction.Category = dto.Category;
                transaction.AmountCents = dto.AmountCents;
                transaction.Date = dto.Date;
                transaction.Type = dto.Type;

                _context.SaveChanges();

                return Ok(transaction);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var userId = GetUserId();

            var transaction = _context.Transactions
                .FirstOrDefault(t => t.Id == id && t.UserId == userId);

            if (transaction == null)
                return NotFound();

            _context.Transactions.Remove(transaction);
            _context.SaveChanges();

            return NoContent();
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(claim))
                throw new UnauthorizedAccessException("Usuário não autenticado.");

            return int.Parse(claim);
        }
    }

}