using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
namespace TechAsset.Api.Controllers;
[ApiController, Route("api/requests"), Authorize]
public class RequestsController(IRequestService requests) : ControllerBase {
 [HttpGet] public async Task<IActionResult> List()=>Ok(await requests.ListAsync());
 [HttpPost] public async Task<IActionResult> Create(CreateRequestDto input)=>Created("/api/requests",await requests.CreateAsync(input));
 [HttpPost("{id:guid}/approve"),Authorize(Policy="TechOrAdmin")]
 public async Task<IActionResult> Approve(Guid id)=>Ok(await requests.ApproveAsync(id));
 [HttpPost("{id:guid}/reject"),Authorize(Policy="TechOrAdmin")]
 public async Task<IActionResult> Reject(Guid id){await requests.RejectAsync(id);return NoContent();}
}
