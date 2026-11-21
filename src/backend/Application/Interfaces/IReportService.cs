using TechAsset.Application.DTOs;
namespace TechAsset.Application.Interfaces;
public interface IReportService {
 Task<DashboardDto> GetDashboardAsync();
 Task<IReadOnlyList<AreaUsageDto>> GetLoansByAreaAsync();
 Task<IReadOnlyList<EquipmentUsageDto>> GetMostUsedEquipmentAsync();
 Task<IReadOnlyList<MovementDto>> GetMovementsAsync();
}
