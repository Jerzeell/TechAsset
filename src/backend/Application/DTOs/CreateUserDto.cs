using System.ComponentModel.DataAnnotations;
namespace TechAsset.Application.DTOs;

public class CreateUserDto
{
    [Required, MaxLength(100)] public string Nombres { get; set; } = "";
    [Required, MaxLength(100)] public string Apellidos { get; set; } = "";
    [Required, MaxLength(150), EmailAddress] public string Correo { get; set; } = "";
    [Required, MaxLength(100)] public string Area { get; set; } = "";
    public string Password { get; set; } = "";
    [Required, RegularExpression("Administrador|ResponsableTecnologia|Colaborador")] public string Rol { get; set; } = "Colaborador";
}
