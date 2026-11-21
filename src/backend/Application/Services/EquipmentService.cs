using TechAsset.Application.Exceptions;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TechAsset.Application.Services
{
    public class EquipmentService : IEquipmentService
    {
        private readonly IApplicationDbContext _context;

        public EquipmentService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EquipmentDto>> GetAllAsync()
        {
            return await _context.Equipments
                .Select(e => new EquipmentDto
                {
                    Id = e.Id,
                    CodigoPatrimonial = e.CodigoPatrimonial,
                    Nombre = e.Nombre,
                    Categoria = e.Categoria,
                    Marca = e.Marca,
                    Estado = e.Estado
                })
                .ToListAsync();
        }

        public async Task<EquipmentDto?> GetByIdAsync(Guid id)
        {
            var e = await _context.Equipments.FindAsync(id);
            if (e == null) return null;
            return new EquipmentDto
            {
                Id = e.Id,
                CodigoPatrimonial = e.CodigoPatrimonial,
                Nombre = e.Nombre,
                Categoria = e.Categoria,
                Marca = e.Marca,
                Estado = e.Estado
            };
        }

        public async Task<EquipmentDto> CreateAsync(CreateEquipmentDto dto)
        {
            InputValidation.Equipment(dto);
            if (dto.Estado == "Prestado") throw new BusinessRuleException("El estado Prestado se asigna al registrar un préstamo.");
            // RN-07: El código patrimonial debe ser único
            var codeExists = await _context.Equipments.AnyAsync(e => e.CodigoPatrimonial.ToLower() == dto.CodigoPatrimonial.ToLower());
            if (codeExists)
            {
                throw new BusinessRuleException("El código patrimonial ya está registrado (RN-07).");
            }

            var equipment = new Equipment
            {
                Id = Guid.NewGuid(),
                CodigoPatrimonial = dto.CodigoPatrimonial,
                Nombre = dto.Nombre,
                Categoria = dto.Categoria,
                Marca = dto.Marca,
                Estado = string.IsNullOrEmpty(dto.Estado) ? "Disponible" : dto.Estado
            };

            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();

            return new EquipmentDto
            {
                Id = equipment.Id,
                CodigoPatrimonial = equipment.CodigoPatrimonial,
                Nombre = equipment.Nombre,
                Categoria = equipment.Categoria,
                Marca = equipment.Marca,
                Estado = equipment.Estado
            };
        }

        public async Task<EquipmentDto?> UpdateAsync(Guid id, CreateEquipmentDto dto)
        {
            InputValidation.Equipment(dto);
            var e = await _context.Equipments.FindAsync(id);
            if (e == null) return null;
            await ValidateState(id, dto.Estado);

            // RN-07: El código patrimonial debe ser único
            if (e.CodigoPatrimonial.ToLower() != dto.CodigoPatrimonial.ToLower())
            {
                var codeExists = await _context.Equipments.AnyAsync(eq => eq.CodigoPatrimonial.ToLower() == dto.CodigoPatrimonial.ToLower());
                if (codeExists)
                {
                    throw new BusinessRuleException("El código patrimonial ya está registrado (RN-07).");
                }
            }

            e.CodigoPatrimonial = dto.CodigoPatrimonial;
            e.Nombre = dto.Nombre;
            e.Categoria = dto.Categoria;
            e.Marca = dto.Marca;
            if (!string.IsNullOrEmpty(dto.Estado))
            {
                e.Estado = dto.Estado;
            }

            await _context.SaveChangesAsync();

            return new EquipmentDto
            {
                Id = e.Id,
                CodigoPatrimonial = e.CodigoPatrimonial,
                Nombre = e.Nombre,
                Categoria = e.Categoria,
                Marca = e.Marca,
                Estado = e.Estado
            };
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return false;

            // RN-06: No se puede eliminar un equipo con historial de préstamos
            var hasHistory = await _context.Loans.AnyAsync(l => l.EquipoId == id);
            if (hasHistory)
            {
                throw new BusinessRuleException("No se puede eliminar un equipo con historial de préstamos (RN-06).");
            }

            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task ValidateState(Guid id, string state)
        {
            if (!new[] { "Disponible", "Prestado", "Mantenimiento", "Baja" }.Contains(state)) throw new BusinessRuleException("Estado de equipo inválido.");
            var active = await _context.Loans.AnyAsync(l => l.EquipoId == id && l.FechaDevolucion == null);
            if (active && state != "Prestado") throw new BusinessRuleException("Registre primero la devolución del equipo (RN-01).");
            if (!active && state == "Prestado") throw new BusinessRuleException("Registre un préstamo para asignar el estado Prestado.");
        }
        public async Task<EquipmentDto?> UpdateStateAsync(Guid id, string state)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return null;

            await ValidateState(id, state);
            equipment.Estado = state;
            await _context.SaveChangesAsync();

            return new EquipmentDto
            {
                Id = equipment.Id,
                CodigoPatrimonial = equipment.CodigoPatrimonial,
                Nombre = equipment.Nombre,
                Categoria = equipment.Categoria,
                Marca = equipment.Marca,
                Estado = equipment.Estado
            };
        }
    }
}
