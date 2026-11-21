using TechAsset.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;

namespace TechAsset.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;

        public AuthController(IAuthService authService, IUserService userService)
        {
            _authService = authService;
            _userService = userService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var token = await _authService.LoginAsync(request.Email, request.Password);
                if (token == null)
                {
                    return Unauthorized(new { message = "Correo o contraseña incorrectos." });
                }

                // Fetch user info to send back
                var id = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().ReadJwtToken(token).Claims.First(c => c.Type == "nameid").Value;
                var user = await _userService.GetByIdAsync(Guid.Parse(id));

                return Ok(new
                {
                    token,
                    user
                });
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
        {
            var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var token = await _authService.ChangePasswordAsync(id, request.CurrentPassword, request.NewPassword, request.Confirmation);
            return Ok(new { token, user = await _userService.GetByIdAsync(id) });
        }

        [HttpGet("support-contacts")]
        public async Task<IActionResult> SupportContacts([FromServices] IApplicationDbContext db)
        {
            // Only active designated administrators; this is not a public user directory.
            var contacts = await db.Users.Where(u => u.Estado && u.Rol == "Administrador")
                .OrderBy(u => u.Correo).Take(3)
                .Select(u => new { nombre = u.Nombres + " " + u.Apellidos, correo = u.Correo, area = u.Area }).ToListAsync();
            return Ok(contacts);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var userDto = await _authService.RegisterAsync(new CreateUserDto
                {
                    Nombres = request.Nombres,
                    Apellidos = request.Apellidos,
                    Correo = request.Correo,
                    Area = request.Area,
                    Password = request.Password
                }, "Colaborador");

                return Ok(userDto);
            }
            catch (BusinessRuleException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class ChangePasswordRequest
    {
        [Required, StringLength(128)] public string CurrentPassword { get; set; } = "";
        [Required, StringLength(128)] public string NewPassword { get; set; } = "";
        [Required, StringLength(128)] public string Confirmation { get; set; } = "";
    }
    public class LoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required, StringLength(128, MinimumLength = 1)]
        public string Password { get; set; } = "";
    }

    public class RegisterRequest
    {
        [Required, StringLength(100)]
        public string Nombres { get; set; } = "";

        [Required, StringLength(100)]
        public string Apellidos { get; set; } = "";

        [Required, EmailAddress, StringLength(150)]
        public string Correo { get; set; } = "";

        [Required, StringLength(100)]
        public string Area { get; set; } = "";

        [Required, StringLength(128, MinimumLength = 1)]
        public string Password { get; set; } = "";

        public string Rol { get; set; } = "Colaborador";
    }
}
