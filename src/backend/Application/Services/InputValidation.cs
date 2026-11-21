using System.ComponentModel.DataAnnotations;
using TechAsset.Application.DTOs;
namespace TechAsset.Application.Services;

public static class InputValidation
{
    public static void User(CreateUserDto d, bool creating)
    {
        d.Nombres = d.Nombres.Trim(); d.Apellidos = d.Apellidos.Trim(); d.Correo = d.Correo.Trim().ToLowerInvariant(); d.Area = d.Area.Trim();
        Validator.ValidateObject(d, new ValidationContext(d), true);
        if (creating && string.IsNullOrEmpty(d.Password)) throw new ValidationException("La contraseña es obligatoria.");
        if (!string.IsNullOrEmpty(d.Password)) PasswordPolicy.Validate(d.Password);
    }
    public static void Equipment(CreateEquipmentDto d)
    {
        d.CodigoPatrimonial = d.CodigoPatrimonial.Trim().ToUpperInvariant(); d.Nombre = d.Nombre.Trim(); d.Marca = d.Marca.Trim(); d.Categoria = d.Categoria.Trim();
        Validator.ValidateObject(d, new ValidationContext(d), true);
    }
}
