using System;
using System.ComponentModel.DataAnnotations;

namespace TechAsset.Core.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(100)]
        public string Nombres { get; set; } = "";

        [Required, MaxLength(100)]
        public string Apellidos { get; set; } = "";

        [Required, MaxLength(150), EmailAddress]
        public string Correo { get; set; } = "";

        [MaxLength(100)]
        public string Area { get; set; } = "";

        public bool Estado { get; set; } = true;
    }

    public class Equipment
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(50)]
        public string CodigoPatrimonial { get; set; } = "";

        [Required, MaxLength(100)]
        public string Nombre { get; set; } = "";

        [MaxLength(50)]
        public string Categoria { get; set; } = "";

        [MaxLength(50)]
        public string Marca { get; set; } = "";

        [MaxLength(30)]
        public string Estado { get; set; } = "Disponible";
    }

    public class Loan
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public DateTime FechaPrestamo { get; set; }

        public DateTime? FechaDevolucion { get; set; }

        public string Observacion { get; set; } = "";

        [Required]
        public Guid UsuarioId { get; set; }

        [Required]
        public Guid EquipoId { get; set; }
    }
}
