using TechAsset.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;

namespace TechAsset.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoansController : ControllerBase
    {
        private readonly ILoanService _loanService;

        public LoansController(ILoanService loanService)
        {
            _loanService = loanService;
        }

        [HttpPost]
        [Authorize(Policy = "TechOrAdmin")]
        public async Task<ActionResult<LoanDto>> Create([FromBody] CreateLoanDto dto)
        {
            try
            {
                var created = await _loanService.CreateLoanAsync(dto);
                return Created($"/api/loans/history", created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/return")]
        [Authorize(Policy = "TechOrAdmin")]
        public async Task<ActionResult<LoanDto>> RegisterReturn(Guid id, [FromBody] RegisterReturnDto dto)
        {
            try
            {
                var updated = await _loanService.RegisterReturnAsync(id, dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "El préstamo no existe." });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<LoanDto>>> GetActive()
        {
            var active = await _loanService.GetActiveLoansAsync();
            return Ok(active);
        }

        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<LoanDto>>> GetHistory()
        {
            var history = await _loanService.GetLoanHistoryAsync();
            return Ok(history);
        }

        [HttpGet("user/{userId:guid}")]
        public async Task<ActionResult<IEnumerable<LoanDto>>> GetByUser(Guid userId)
        {
            var userHistory = await _loanService.GetLoansByUserAsync(userId);
            return Ok(userHistory);
        }

        [HttpGet("equipment/{equipmentId:guid}")]
        [Authorize(Policy = "TechOrAdmin")]
        public async Task<ActionResult<IEnumerable<LoanDto>>> GetByEquipment(Guid equipmentId)
        {
            var equipmentHistory = await _loanService.GetLoansByEquipmentAsync(equipmentId);
            return Ok(equipmentHistory);
        }
    }
}
