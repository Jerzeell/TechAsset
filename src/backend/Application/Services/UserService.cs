using TechAsset.Application.Exceptions;
using TechAsset.Application.DTOs;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace TechAsset.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IApplicationDbContext _context;

        public UserService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            return await _context.Users
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Nombres = u.Nombres,
                    Apellidos = u.Apellidos,
                    Correo = u.Correo,
                    Area = u.Area,
                    Estado = u.Estado,
                    Rol = u.Rol,
                    MustChangePassword = u.MustChangePassword,
                    PasswordChangedAt = u.PasswordChangedAt
                })
                .ToListAsync();
        }

        public async Task<UserDto?> GetByIdAsync(Guid id)
        {
            var u = await _context.Users.FindAsync(id);
            if (u == null) return null;
            return new UserDto
            {
                Id = u.Id,
                Nombres = u.Nombres,
                Apellidos = u.Apellidos,
                Correo = u.Correo,
                Area = u.Area,
                Estado = u.Estado,
                Rol = u.Rol,
                    MustChangePassword = u.MustChangePassword,
                    PasswordChangedAt = u.PasswordChangedAt
            };
        }

        public async Task<UserDto> CreateAsync(CreateUserDto dto)
        {
            InputValidation.User(dto, true);
            // RN-08: Correo electrónico del usuario debe ser único
            var emailExists = await _context.Users.AnyAsync(u => u.Correo.ToLower() == dto.Correo.ToLower());
            if (emailExists)
            {
                throw new BusinessRuleException("El correo electrónico ya está registrado (RN-08).");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Nombres = dto.Nombres,
                Apellidos = dto.Apellidos,
                Correo = dto.Correo,
                Area = dto.Area,
                PasswordHash = HashPassword(dto.Password),
                Rol = string.IsNullOrEmpty(dto.Rol) ? "Colaborador" : dto.Rol,
                Estado = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                Nombres = user.Nombres,
                Apellidos = user.Apellidos,
                Correo = user.Correo,
                Area = user.Area,
                Estado = user.Estado,
                Rol = user.Rol,
                    MustChangePassword = user.MustChangePassword,
                    PasswordChangedAt = user.PasswordChangedAt
            };
        }

        public async Task<UserDto?> UpdateAsync(Guid id, CreateUserDto dto)
        {
            InputValidation.User(dto, false);
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            // Check email uniqueness if email is changing
            if (user.Correo.ToLower() != dto.Correo.ToLower())
            {
                var emailExists = await _context.Users.AnyAsync(u => u.Correo.ToLower() == dto.Correo.ToLower());
                if (emailExists)
                {
                    throw new BusinessRuleException("El correo electrónico ya está registrado (RN-08).");
                }
            }

            user.Nombres = dto.Nombres;
            user.Apellidos = dto.Apellidos;
            user.Correo = dto.Correo;
            user.Area = dto.Area;

            if (!string.IsNullOrEmpty(dto.Password))
            {
                user.PasswordHash = HashPassword(dto.Password);
                user.MustChangePassword = true;
                user.SessionVersion++;
            }

            if (!string.IsNullOrEmpty(dto.Rol))
            {
                if (user.Rol != dto.Rol) user.SessionVersion++;
                user.Rol = dto.Rol;
            }

            await _context.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                Nombres = user.Nombres,
                Apellidos = user.Apellidos,
                Correo = user.Correo,
                Area = user.Area,
                Estado = user.Estado,
                Rol = user.Rol,
                    MustChangePassword = user.MustChangePassword,
                    PasswordChangedAt = user.PasswordChangedAt
            };
        }

        public async Task DisableAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                user.Estado = false;
                await _context.SaveChangesAsync();
            }
        }

        public static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(16);
            var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, 210000, HashAlgorithmName.SHA256, 32);
            return $"pbkdf2$210000${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
        }

        public static bool VerifyPassword(string password, string hash)
        {
            if (!hash.StartsWith("pbkdf2$"))
            {
                var legacy = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(password))).ToLowerInvariant();
                return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(legacy), Encoding.UTF8.GetBytes(hash));
            }
            try
            {
                var parts = hash.Split('$');
                var key = Rfc2898DeriveBytes.Pbkdf2(password, Convert.FromBase64String(parts[2]), int.Parse(parts[1]), HashAlgorithmName.SHA256, 32);
                return CryptographicOperations.FixedTimeEquals(key, Convert.FromBase64String(parts[3]));
            }
            catch { return false; }
        }
    }
}
