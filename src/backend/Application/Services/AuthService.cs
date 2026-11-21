using TechAsset.Application.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Entities;

namespace TechAsset.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(IApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<string?> LoginAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Correo.ToLower() == email.Trim().ToLower());
            if (user == null) return null;

            // Verify account status
            if (!user.Estado)
            {
                throw new BusinessRuleException("La cuenta está deshabilitada.");
            }

            // Verify password
            if (!UserService.VerifyPassword(password, user.PasswordHash))
            {
                return null;
            }

            if (!user.PasswordHash.StartsWith("pbkdf2$"))
            {
                user.PasswordHash = UserService.HashPassword(password);
                await _context.SaveChangesAsync();
            }

            // Generate JWT Token
            return GenerateJwtToken(user);
        }

        public async Task<UserDto> RegisterAsync(CreateUserDto dto, string role)
        {
            dto.Rol = "Colaborador";
            return await new UserService(_context).CreateAsync(dto);
        }
        public async Task<string> ChangePasswordAsync(Guid id, string currentPassword, string newPassword, string confirmation)
        {
            var user = await _context.Users.FindAsync(id) ?? throw new BusinessRuleException("La cuenta no está disponible.");
            if (!user.Estado || !UserService.VerifyPassword(currentPassword, user.PasswordHash))
                throw new BusinessRuleException("La contraseña actual no es correcta.");
            PasswordPolicy.Validate(newPassword);
            if (newPassword != confirmation) throw new BusinessRuleException("Las contraseñas nuevas no coinciden.");
            if (UserService.VerifyPassword(newPassword, user.PasswordHash)) throw new BusinessRuleException("Elige una contraseña diferente de la actual.");
            user.PasswordHash = UserService.HashPassword(newPassword);
            user.MustChangePassword = false;
            user.PasswordChangedAt = DateTime.UtcNow;
            user.SessionVersion++;
            await _context.SaveChangesAsync();
            return GenerateJwtToken(user);
        }
        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var keyString = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Configure Jwt__Key antes de iniciar.");

            // Ensure the key is long enough for HS256 (minimum 256 bits / 32 bytes)
            if (keyString.Length < 32)
            {
                throw new InvalidOperationException("Jwt__Key debe tener al menos 32 caracteres.");
            }

            var key = Encoding.UTF8.GetBytes(keyString);
            var issuer = _configuration["Jwt:Issuer"] ?? "TechAssetIssuer";

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, $"{user.Nombres} {user.Apellidos}"),
                    new Claim(ClaimTypes.Email, user.Correo),
                    new Claim(ClaimTypes.Role, user.Rol),
                    new Claim("session_version", user.SessionVersion.ToString()),
                    new Claim("password_change_required", user.MustChangePassword ? "true" : "false")
                }),
                Expires = user.MustChangePassword ? DateTime.UtcNow.AddMinutes(15) : DateTime.UtcNow.AddHours(8),
                Issuer = issuer,
                Audience = issuer, // Set audience same as issuer for simplicity
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
