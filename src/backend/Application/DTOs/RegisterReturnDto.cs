using System;
using System.ComponentModel.DataAnnotations;

namespace TechAsset.Application.DTOs
{
    public class RegisterReturnDto
    {
        [Required]
        public DateTime FechaDevolucion { get; set; } = DateTime.UtcNow;

        [Required(ErrorMessage = "Toda devolución deberá registrar observaciones (RN-10).")]
        [StringLength(2000)]
        public string Observacion { get; set; } = "";
        [RegularExpression("Disponible|Mantenimiento")]
        public string EstadoEquipo { get; set; } = "Disponible";
    }
}
