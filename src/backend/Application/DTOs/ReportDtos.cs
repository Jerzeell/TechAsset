namespace TechAsset.Application.DTOs;
public record DashboardDto(int TotalEquipments,int AvailableEquipments,int LoanedEquipments,int MaintenanceEquipments,int DecommissionedEquipments,int TotalLoans,string AreaConMayorUso,int AreaConMayorUsoCantidad);
public record AreaUsageDto(string Area,int TotalLoans,int ActiveLoans);
public record EquipmentUsageDto(Guid EquipmentId,string Nombre,string CodigoPatrimonial,string Categoria,string Marca,int TimesUsed);
public record MovementDto(Guid Id,DateTime Fecha,string Entidad,Guid EntidadId,string Accion,string Detalle,string Responsable);
