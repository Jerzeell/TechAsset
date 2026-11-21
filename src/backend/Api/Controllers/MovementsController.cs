using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.Interfaces;
namespace TechAsset.Api.Controllers;
[ApiController,Route("api/movements"),Authorize(Policy="TechOrAdmin")]
public class MovementsController(IReportService reports) : ControllerBase {
 [HttpGet] public async Task<IActionResult> List()=>Ok(await reports.GetMovementsAsync());
}
