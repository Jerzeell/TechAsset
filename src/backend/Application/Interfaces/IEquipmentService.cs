using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TechAsset.Application.DTOs;

namespace TechAsset.Application.Interfaces
{
    public interface IEquipmentService
    {
        Task<IEnumerable<EquipmentDto>> GetAllAsync();
        Task<EquipmentDto?> GetByIdAsync(Guid id);
        Task<EquipmentDto> CreateAsync(CreateEquipmentDto dto);
        Task<EquipmentDto?> UpdateAsync(Guid id, CreateEquipmentDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<EquipmentDto?> UpdateStateAsync(Guid id, string state);
    }
}
