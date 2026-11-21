using System;

namespace TechAsset.Application.DTOs
{
    public class LoanDto
    {
        public string? ObservacionDevolucion { get; set; }
        public string AreaPrestamo { get; set; } = "";
        public Guid ResponsableId { get; set; }
        public Guid? ResponsableDevolucionId { get; set; }

        public Guid Id { get; set; }
        public DateTime FechaPrestamo { get; set; }
        public DateTime? FechaDevolucion { get; set; }
        public string? Observacion { get; set; }
        public Guid UsuarioId { get; set; }
        public string UsuarioNombre { get; set; } = "";
        public string UsuarioCorreo { get; set; } = "";
        public Guid EquipoId { get; set; }
        public string EquipoNombre { get; set; } = "";
        public string EquipoCodigoPatrimonial { get; set; } = "";
    }
}
