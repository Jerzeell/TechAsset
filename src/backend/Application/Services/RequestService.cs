using TechAsset.Application.Exceptions;
using Microsoft.EntityFrameworkCore;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Entities;
namespace TechAsset.Application.Services;
public sealed class RequestService(IApplicationDbContext db, ICurrentUser current, ILoanService loans) : IRequestService {
 private static RequestDto Map(LoanRequest x)=>new(x.Id,x.UsuarioId,x.EquipoId,x.Motivo,x.Estado,x.FechaSolicitud,x.PrestamoId,$"{x.Usuario?.Nombres} {x.Usuario?.Apellidos}".Trim(),x.Equipo?.Nombre??"");
 public async Task<IReadOnlyList<RequestDto>> ListAsync() {
  var rows=await db.LoanRequests.AsNoTracking().Include(x=>x.Usuario).Include(x=>x.Equipo).Where(x=>current.IsStaff || x.UsuarioId==current.Id).OrderByDescending(x=>x.FechaSolicitud).ToListAsync();return rows.Select(Map).ToList();
 }
 public async Task<RequestDto> CreateAsync(CreateRequestDto input) {
  var equipment=await db.Equipments.FindAsync(input.EquipoId);
  if(equipment?.Estado!="Disponible")throw new BusinessRuleException("El equipo ya no está disponible. Actualiza el inventario y selecciona otro.");
  if(string.IsNullOrWhiteSpace(input.Motivo)||input.Motivo.Length>2000)throw new BusinessRuleException("Describe el motivo de la solicitud con un máximo de 2000 caracteres.");
  if(await db.LoanRequests.AnyAsync(x=>x.UsuarioId==current.Id && x.EquipoId==input.EquipoId && x.Estado=="Pendiente"))throw new BusinessRuleException("Ya tienes una solicitud pendiente para este equipo. Consulta su estado en Solicitudes.");
  var request=new LoanRequest {UsuarioId=current.Id,Usuario=await db.Users.FindAsync(current.Id),EquipoId=input.EquipoId,Equipo=equipment,Motivo=input.Motivo.Trim()};
  db.LoanRequests.Add(request);await db.SaveChangesAsync();return Map(request);
 }
 public async Task<LoanDto> ApproveAsync(Guid id) {
  if(!current.IsStaff)throw new BusinessRuleException("Solo Tecnología o Administración puede aprobar solicitudes.");
  await using var transaction=await db.BeginTransactionAsync();
  var request=await db.LoanRequests.Include(x=>x.Usuario).Include(x=>x.Equipo).FirstOrDefaultAsync(x=>x.Id==id)??throw new KeyNotFoundException("La solicitud no existe.");
  if(request.Estado!="Pendiente")throw new BusinessRuleException("La solicitud ya fue procesada. Actualiza la lista.");
  var loan=await loans.CreateLoanAsync(new CreateLoanDto {UsuarioId=request.UsuarioId,EquipoId=request.EquipoId,FechaPrestamo=DateTime.UtcNow,Observacion=request.Motivo});
  request.Estado="Aprobada";request.PrestamoId=loan.Id;await db.SaveChangesAsync();await transaction.CommitAsync();return loan;
 }
 public async Task RejectAsync(Guid id) {
  if(!current.IsStaff)throw new BusinessRuleException("Solo Tecnología o Administración puede rechazar solicitudes.");
  var request=await db.LoanRequests.Include(x=>x.Usuario).Include(x=>x.Equipo).FirstOrDefaultAsync(x=>x.Id==id)??throw new KeyNotFoundException("La solicitud no existe.");
  if(request.Estado!="Pendiente")throw new BusinessRuleException("La solicitud ya fue procesada. Actualiza la lista.");
  request.Estado="Rechazada";await db.SaveChangesAsync();
 }
}
