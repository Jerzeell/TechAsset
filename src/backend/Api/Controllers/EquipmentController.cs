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
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;

        public EquipmentController(IEquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetAll()
        {
            var equipments = await _equipmentService.GetAllAsync();
            return Ok(equipments);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<EquipmentDto>> GetById(Guid id)
        {
            var e = await _equipmentService.GetByIdAsync(id);
            if (e == null) return NotFound();
            return Ok(e);
        }

        [HttpPost]
        [Authorize(Policy = "TechOrAdmin")]
        public async Task<ActionResult<EquipmentDto>> Create([FromBody] CreateEquipmentDto dto)
        {
            try
            {
                var created = await _equipmentService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "TechOrAdmin")]
        public async Task<ActionResult<EquipmentDto>> Update(Guid id, [FromBody] CreateEquipmentDto dto)
        {
            try
            {
                var updated = await _equipmentService.UpdateAsync(id, dto);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "TechOrAdmin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var deleted = await _equipmentService.DeleteAsync(id);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id:guid}/state")]
        [Authorize(Policy = "TechOrAdmin")]
        public async Task<ActionResult<EquipmentDto>> UpdateState(Guid id, [FromBody] UpdateStateRequest request)
        {
            var updated = await _equipmentService.UpdateStateAsync(id, request.Estado);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
    }

    public class UpdateStateRequest
    {
        public string Estado { get; set; } = "";
    }
}
