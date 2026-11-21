using System.ComponentModel.DataAnnotations;

namespace TechAsset.Application.DTOs;

public class CreateEquipmentDto
{
    [Required, MaxLength(50)]
    public string CodigoPatrimonial { get; set; } = "";

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = "";

    [Required, MaxLength(50)]
    public string Categoria { get; set; } = "";

    [Required, MaxLength(50)]
    public string Marca { get; set; } = "";

    [Required, RegularExpression("Disponible|Prestado|Mantenimiento|Baja")]
    public string Estado { get; set; } = "Disponible";
}
