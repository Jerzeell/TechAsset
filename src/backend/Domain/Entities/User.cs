using System;
using System.ComponentModel.DataAnnotations;

namespace TechAsset.Domain.Entities
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

        public bool MustChangePassword { get; set; } = true;
        public int SessionVersion { get; set; }
        public DateTime? PasswordChangedAt { get; set; }

        public bool Estado { get; set; } = true; // true = enabled

        [Required]
        public string PasswordHash { get; set; } = "";

        [Required, MaxLength(50)]
        public string Rol { get; set; } = "Colaborador"; // Administrador, ResponsableTecnologia, Colaborador
    }
}
