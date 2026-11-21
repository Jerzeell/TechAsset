using System;
using System.ComponentModel.DataAnnotations;

namespace TechAsset.Application.DTOs
{
    public class UserDto
    {
        public bool MustChangePassword { get; set; }
        public DateTime? PasswordChangedAt { get; set; }
        public Guid Id { get; set; }
        public string Nombres { get; set; } = "";
        public string Apellidos { get; set; } = "";
        public string Correo { get; set; } = "";
        public string Area { get; set; } = "";
        public bool Estado { get; set; }
        public string Rol { get; set; } = "";
    }
}
