using System;
using System.ComponentModel.DataAnnotations;

namespace TechAsset.Domain.Entities
{
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

        // Possible states: Disponible, Prestado, Mantenimiento, Baja
        [MaxLength(30)]
        public string Estado { get; set; } = "Disponible";
    }
}
