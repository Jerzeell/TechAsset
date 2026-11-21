using Microsoft.EntityFrameworkCore;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
namespace TechAsset.Application.Services;
public sealed class ReportService(IApplicationDbContext db) : IReportService {
 public async Task<DashboardDto> GetDashboardAsync(){
  var total=await db.Equipments.CountAsync();
  var available=await db.Equipments.CountAsync(e=>e.Estado=="Disponible");
  var loaned=await db.Equipments.CountAsync(e=>e.Estado=="Prestado");
  var maintenance=await db.Equipments.CountAsync(e=>e.Estado=="Mantenimiento");
  var decommissioned=await db.Equipments.CountAsync(e=>e.Estado=="Baja");
  var totalLoans=await db.Loans.CountAsync();
  var top=await db.Loans.Where(l=>l.AreaPrestamo!="").GroupBy(l=>l.AreaPrestamo).Select(g=>new {Area=g.Key,Count=g.Count()}).OrderByDescending(x=>x.Count).ThenBy(x=>x.Area).FirstOrDefaultAsync();
  return new(total,available,loaned,maintenance,decommissioned,totalLoans,top?.Area??"Ninguna",top?.Count??0);
 }
 public async Task<IReadOnlyList<AreaUsageDto>> GetLoansByAreaAsync(){
  var rows=await db.Loans.AsNoTracking().Where(l=>l.AreaPrestamo!="").GroupBy(l=>l.AreaPrestamo).Select(g=>new {Area=g.Key,Total=g.Count(),Active=g.Count(l=>l.FechaDevolucion==null)}).OrderByDescending(x=>x.Total).ThenBy(x=>x.Area).ToListAsync();
  return rows.Select(x=>new AreaUsageDto(x.Area,x.Total,x.Active)).ToList();
 }
 public async Task<IReadOnlyList<EquipmentUsageDto>> GetMostUsedEquipmentAsync(){
  var rows=await db.Loans.AsNoTracking().GroupBy(l=>new {l.EquipoId,l.Equipo!.Nombre,l.Equipo.CodigoPatrimonial,l.Equipo.Categoria,l.Equipo.Marca}).Select(g=>new {g.Key.EquipoId,g.Key.Nombre,g.Key.CodigoPatrimonial,g.Key.Categoria,g.Key.Marca,Total=g.Count()}).OrderByDescending(x=>x.Total).ThenBy(x=>x.CodigoPatrimonial).Take(5).ToListAsync();
  return rows.Select(x=>new EquipmentUsageDto(x.EquipoId,x.Nombre,x.CodigoPatrimonial,x.Categoria,x.Marca,x.Total)).ToList();
 }
 public async Task<IReadOnlyList<MovementDto>> GetMovementsAsync()=>await db.Movements.AsNoTracking().OrderByDescending(x=>x.Fecha).Select(x=>new MovementDto(x.Id,x.Fecha,x.Entidad,x.EntidadId,x.Accion,x.Detalle,x.Responsable)).ToListAsync();
}
