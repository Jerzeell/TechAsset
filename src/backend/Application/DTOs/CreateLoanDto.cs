using System;
using System.ComponentModel.DataAnnotations;

namespace TechAsset.Application.DTOs
{
    public class CreateLoanDto
    {
        [Required]
        public Guid UsuarioId { get; set; }

        [Required]
        public Guid EquipoId { get; set; }

        [Required]
        public DateTime FechaPrestamo { get; set; } = DateTime.UtcNow;

        [StringLength(2000)]
        public string? Observacion { get; set; }
    }
}
