using System.Security.Claims;
using TechAsset.Application.Interfaces;
namespace TechAsset.Api;

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid Id => Guid.TryParse(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;
    public string Name => accessor.HttpContext?.User.Identity?.Name ?? "Sistema";
    public bool IsStaff => accessor.HttpContext?.User.IsInRole("Administrador") == true || accessor.HttpContext?.User.IsInRole("ResponsableTecnologia") == true;
}
