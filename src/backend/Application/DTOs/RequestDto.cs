namespace TechAsset.Application.DTOs;
public record RequestDto(Guid Id, Guid UsuarioId, Guid EquipoId, string Motivo, string Estado, DateTime FechaSolicitud, Guid? PrestamoId, string UsuarioNombre, string EquipoNombre);
public class CreateRequestDto {
 public Guid EquipoId { get; set; }
 [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.StringLength(2000)]
 public string Motivo { get; set; } = "";
}
