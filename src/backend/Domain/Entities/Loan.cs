using System;
using System.ComponentModel.DataAnnotations;

namespace TechAsset.Domain.Entities
{
    public class Loan
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public DateTime FechaPrestamo { get; set; }

        public DateTime? FechaDevolucion { get; set; }

        public string? Observacion { get; set; }

        [Required]
        public Guid UsuarioId { get; set; }

        [Required]
        public Guid EquipoId { get; set; }

        public string? ObservacionDevolucion { get; set; }
        public string AreaPrestamo { get; set; } = "";
        public Guid ResponsableId { get; set; }
        public Guid? ResponsableDevolucionId { get; set; }

        // Navigation properties
        public User? Usuario { get; set; }
        public Equipment? Equipo { get; set; }
    }
}
