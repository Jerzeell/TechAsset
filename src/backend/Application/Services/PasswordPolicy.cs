using System.ComponentModel.DataAnnotations;
namespace TechAsset.Application.Services;
public static class PasswordPolicy
{
    public static void Validate(string password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8 || password.Length > 128 ||
            !password.Any(char.IsUpper) || !password.Any(char.IsLower) ||
            !password.Any(char.IsDigit) || !password.Any(c => !char.IsLetterOrDigit(c) && !char.IsWhiteSpace(c)))
            throw new ValidationException("La contraseña debe tener entre 8 y 128 caracteres, una mayúscula, una minúscula, un número y un símbolo (por ejemplo: @, #, !). Los espacios no cuentan como símbolo.");
    }
}
