using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechAsset.Application.Interfaces;
namespace TechAsset.Api.Controllers;
[ApiController,Route("api/reports"),Authorize(Policy="TechOrAdmin")]
public class ReportsController(IReportService reports) : ControllerBase {
 [HttpGet("dashboard")] public async Task<IActionResult> Dashboard()=>Ok(await reports.GetDashboardAsync());
 [HttpGet("loans-by-area")] public async Task<IActionResult> LoansByArea()=>Ok(await reports.GetLoansByAreaAsync());
 [HttpGet("most-used-equipment")] public async Task<IActionResult> MostUsed()=>Ok(await reports.GetMostUsedEquipmentAsync());
}
