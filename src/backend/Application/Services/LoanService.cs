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
    public class LoanService : ILoanService
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUser _current;

        public LoanService(IApplicationDbContext context, ICurrentUser current)
        {
            _context = context;
            _current = current;
        }

        public async Task<LoanDto> CreateLoanAsync(CreateLoanDto dto)
        {
            // RN-05: Todo préstamo debe registrar un responsable
            if (dto.UsuarioId == Guid.Empty)
            {
                throw new ArgumentException("El préstamo debe registrar un usuario responsable (RN-05).");
            }

            var user = await _context.Users.FindAsync(dto.UsuarioId);
            if (user == null)
            {
                throw new BusinessRuleException("El usuario responsable no existe.");
            }

            if (!user.Estado)
            {
                throw new BusinessRuleException("No se puede asignar un préstamo a un usuario deshabilitado.");
            }

            var equipment = await _context.Equipments.FindAsync(dto.EquipoId);
            if (equipment == null)
            {
                throw new BusinessRuleException("El equipo no existe.");
            }

            // RN-02: No se puede prestar un equipo en estado “Mantenimiento”
            if (equipment.Estado.Equals("Mantenimiento", StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessRuleException("No se puede prestar un equipo en estado 'Mantenimiento' (RN-02).");
            }

            // RN-03: No se puede prestar un equipo en estado “Baja”
            if (equipment.Estado.Equals("Baja", StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessRuleException("No se puede prestar un equipo en estado 'Baja' (RN-03).");
            }

            // RN-01: Un equipo solo puede estar asociado a un préstamo activo
            var hasActiveLoan = await _context.Loans.AnyAsync(l => l.EquipoId == dto.EquipoId && l.FechaDevolucion == null);
            if (hasActiveLoan || equipment.Estado.Equals("Prestado", StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessRuleException("El equipo ya se encuentra en un préstamo activo (RN-01).");
            }

            if (!_current.IsStaff) throw new BusinessRuleException("Solo Tecnología o Administración puede asignar equipos.");
            dto.FechaPrestamo = dto.FechaPrestamo.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.FechaPrestamo, DateTimeKind.Utc) : dto.FechaPrestamo.ToUniversalTime();
            if (dto.FechaPrestamo == default || dto.FechaPrestamo > DateTime.UtcNow.AddMinutes(1)) throw new BusinessRuleException("La fecha de préstamo no puede estar vacía ni ser futura.");
            var loan = new Loan
            {
                Id = Guid.NewGuid(),
                UsuarioId = dto.UsuarioId,
                EquipoId = dto.EquipoId,
                FechaPrestamo = dto.FechaPrestamo,
                FechaDevolucion = null,
                Observacion = dto.Observacion?.Trim(),
                ResponsableId = _current.Id,
                AreaPrestamo = user.Area
            };

            // Update equipment state to "Prestado"
            equipment.Estado = "Prestado";

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            return new LoanDto
            {
                Id = loan.Id,
                FechaPrestamo = loan.FechaPrestamo,
                FechaDevolucion = loan.FechaDevolucion,
                Observacion = loan.Observacion,
                ObservacionDevolucion = loan.ObservacionDevolucion,
                AreaPrestamo = loan.AreaPrestamo,
                ResponsableId = loan.ResponsableId,
                ResponsableDevolucionId = loan.ResponsableDevolucionId,
                UsuarioId = loan.UsuarioId,
                UsuarioNombre = $"{user.Nombres} {user.Apellidos}",
                UsuarioCorreo = user.Correo,
                EquipoId = loan.EquipoId,
                EquipoNombre = equipment.Nombre,
                EquipoCodigoPatrimonial = equipment.CodigoPatrimonial
            };
        }

        public async Task<LoanDto> RegisterReturnAsync(Guid loanId, RegisterReturnDto dto)
        {
            if (!_current.IsStaff) throw new BusinessRuleException("Solo Tecnología o Administración puede registrar devoluciones.");
            dto.FechaDevolucion = dto.FechaDevolucion.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.FechaDevolucion, DateTimeKind.Utc) : dto.FechaDevolucion.ToUniversalTime();
            if (dto.FechaDevolucion > DateTime.UtcNow.AddMinutes(1) || dto.FechaDevolucion == default) throw new BusinessRuleException("La fecha de devolución no puede estar vacía ni ser futura.");
            if (dto.EstadoEquipo != "Disponible" && dto.EstadoEquipo != "Mantenimiento") throw new BusinessRuleException("Estado de devolución inválido.");
            var loan = await _context.Loans
                .Include(l => l.Usuario)
                .Include(l => l.Equipo)
                .FirstOrDefaultAsync(l => l.Id == loanId);

            if (loan == null)
            {
                throw new KeyNotFoundException("El préstamo especificado no existe.");
            }

            if (loan.FechaDevolucion != null)
            {
                throw new BusinessRuleException("El préstamo ya ha sido devuelto anteriormente.");
            }

            // RN-04: La fecha de devolución debe ser posterior a la fecha de préstamo
            if (dto.FechaDevolucion <= loan.FechaPrestamo)
            {
                throw new BusinessRuleException("La fecha de devolución debe ser posterior a la fecha de préstamo (RN-04).");
            }

            // RN-10: Toda devolución deberá registrar observaciones
            if (string.IsNullOrWhiteSpace(dto.Observacion))
            {
                throw new BusinessRuleException("Toda devolución deberá registrar observaciones (RN-10).");
            }

            loan.FechaDevolucion = dto.FechaDevolucion;
            loan.ObservacionDevolucion = dto.Observacion.Trim();
            loan.ResponsableDevolucionId = _current.Id;

            // Reset equipment state to "Disponible"
            if (loan.Equipo != null)
            {
                loan.Equipo.Estado = dto.EstadoEquipo;
            }

            await _context.SaveChangesAsync();

            return new LoanDto
            {
                Id = loan.Id,
                FechaPrestamo = loan.FechaPrestamo,
                FechaDevolucion = loan.FechaDevolucion,
                Observacion = loan.Observacion,
                ObservacionDevolucion = loan.ObservacionDevolucion,
                AreaPrestamo = loan.AreaPrestamo,
                ResponsableId = loan.ResponsableId,
                ResponsableDevolucionId = loan.ResponsableDevolucionId,
                UsuarioId = loan.UsuarioId,
                UsuarioNombre = loan.Usuario != null ? $"{loan.Usuario.Nombres} {loan.Usuario.Apellidos}" : "Desconocido",
                UsuarioCorreo = loan.Usuario != null ? loan.Usuario.Correo : "",
                EquipoId = loan.EquipoId,
                EquipoNombre = loan.Equipo != null ? loan.Equipo.Nombre : "Desconocido",
                EquipoCodigoPatrimonial = loan.Equipo != null ? loan.Equipo.CodigoPatrimonial : ""
            };
        }

        public async Task<IEnumerable<LoanDto>> GetActiveLoansAsync()
        {
            return await _context.Loans
                .Where(l => l.FechaDevolucion == null && (_current.IsStaff || l.UsuarioId == _current.Id))
                .OrderByDescending(l => l.FechaPrestamo)
                .Select(l => new LoanDto
                {
                    Id = l.Id,
                    FechaPrestamo = l.FechaPrestamo,
                    FechaDevolucion = l.FechaDevolucion,
                    Observacion = l.Observacion,
                    ObservacionDevolucion = l.ObservacionDevolucion,
                    AreaPrestamo = l.AreaPrestamo,
                    ResponsableId = l.ResponsableId,
                    ResponsableDevolucionId = l.ResponsableDevolucionId,
                    UsuarioId = l.UsuarioId,
                    UsuarioNombre = l.Usuario != null ? $"{l.Usuario.Nombres} {l.Usuario.Apellidos}" : "Desconocido",
                    UsuarioCorreo = l.Usuario != null ? l.Usuario.Correo : "",
                    EquipoId = l.EquipoId,
                    EquipoNombre = l.Equipo != null ? l.Equipo.Nombre : "Desconocido",
                    EquipoCodigoPatrimonial = l.Equipo != null ? l.Equipo.CodigoPatrimonial : ""
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<LoanDto>> GetLoanHistoryAsync()
        {
            return await _context.Loans
                .Where(l => _current.IsStaff || l.UsuarioId == _current.Id)
                .OrderByDescending(l => l.FechaPrestamo)
                .Select(l => new LoanDto
                {
                    Id = l.Id,
                    FechaPrestamo = l.FechaPrestamo,
                    FechaDevolucion = l.FechaDevolucion,
                    Observacion = l.Observacion,
                    ObservacionDevolucion = l.ObservacionDevolucion,
                    AreaPrestamo = l.AreaPrestamo,
                    ResponsableId = l.ResponsableId,
                    ResponsableDevolucionId = l.ResponsableDevolucionId,
                    UsuarioId = l.UsuarioId,
                    UsuarioNombre = l.Usuario != null ? $"{l.Usuario.Nombres} {l.Usuario.Apellidos}" : "Desconocido",
                    UsuarioCorreo = l.Usuario != null ? l.Usuario.Correo : "",
                    EquipoId = l.EquipoId,
                    EquipoNombre = l.Equipo != null ? l.Equipo.Nombre : "Desconocido",
                    EquipoCodigoPatrimonial = l.Equipo != null ? l.Equipo.CodigoPatrimonial : ""
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<LoanDto>> GetLoansByUserAsync(Guid userId)
        {
            return await _context.Loans
                .Where(l => l.UsuarioId == userId && (_current.IsStaff || userId == _current.Id))
                .OrderByDescending(l => l.FechaPrestamo)
                .Select(l => new LoanDto
                {
                    Id = l.Id,
                    FechaPrestamo = l.FechaPrestamo,
                    FechaDevolucion = l.FechaDevolucion,
                    Observacion = l.Observacion,
                    ObservacionDevolucion = l.ObservacionDevolucion,
                    AreaPrestamo = l.AreaPrestamo,
                    ResponsableId = l.ResponsableId,
                    ResponsableDevolucionId = l.ResponsableDevolucionId,
                    UsuarioId = l.UsuarioId,
                    UsuarioNombre = l.Usuario != null ? $"{l.Usuario.Nombres} {l.Usuario.Apellidos}" : "Desconocido",
                    UsuarioCorreo = l.Usuario != null ? l.Usuario.Correo : "",
                    EquipoId = l.EquipoId,
                    EquipoNombre = l.Equipo != null ? l.Equipo.Nombre : "Desconocido",
                    EquipoCodigoPatrimonial = l.Equipo != null ? l.Equipo.CodigoPatrimonial : ""
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<LoanDto>> GetLoansByEquipmentAsync(Guid equipmentId)
        {
            return await _context.Loans
                .Where(l => l.EquipoId == equipmentId)
                .OrderByDescending(l => l.FechaPrestamo)
                .Select(l => new LoanDto
                {
                    Id = l.Id,
                    FechaPrestamo = l.FechaPrestamo,
                    FechaDevolucion = l.FechaDevolucion,
                    Observacion = l.Observacion,
                    ObservacionDevolucion = l.ObservacionDevolucion,
                    AreaPrestamo = l.AreaPrestamo,
                    ResponsableId = l.ResponsableId,
                    ResponsableDevolucionId = l.ResponsableDevolucionId,
                    UsuarioId = l.UsuarioId,
                    UsuarioNombre = l.Usuario != null ? $"{l.Usuario.Nombres} {l.Usuario.Apellidos}" : "Desconocido",
                    UsuarioCorreo = l.Usuario != null ? l.Usuario.Correo : "",
                    EquipoId = l.EquipoId,
                    EquipoNombre = l.Equipo != null ? l.Equipo.Nombre : "Desconocido",
                    EquipoCodigoPatrimonial = l.Equipo != null ? l.Equipo.CodigoPatrimonial : ""
                })
                .ToListAsync();
        }
    }
}
