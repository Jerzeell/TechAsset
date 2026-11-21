namespace TechAsset.Domain.Entities;

public class Movement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public string Entidad { get; set; } = "";
    public Guid EntidadId { get; set; }
    public string Accion { get; set; } = "";
    public string Detalle { get; set; } = "";
    public string Responsable { get; set; } = "";
}
