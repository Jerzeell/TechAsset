namespace TechAsset.Domain.Entities;

public class LoanRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public User? Usuario { get; set; }
    public Guid EquipoId { get; set; }
    public Equipment? Equipo { get; set; }
    public string Motivo { get; set; } = "";
    public string Estado { get; set; } = "Pendiente";
    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
    public Guid? PrestamoId { get; set; }
}
