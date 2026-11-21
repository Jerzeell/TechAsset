using System.Threading.Tasks;
using TechAsset.Application.DTOs;

namespace TechAsset.Application.Interfaces
{
    public interface IAuthService
    {
        Task<string?> LoginAsync(string email, string password);
        Task<string> ChangePasswordAsync(System.Guid id, string currentPassword, string newPassword, string confirmation);
        Task<UserDto> RegisterAsync(CreateUserDto dto, string role);
    }
}
