using UnoOnline.Models;

namespace UnoOnline.Interfaces
{
    public interface IUserRepository
    {
        Task<ICollection<User>> GetUsersAsync();
        Task<ICollection<User>> GetUsersExceptAsync(long userId);
        Task<User> GetUserByIdAsync(long id);
        Task<User> GetUserByEmailAsync(string email);
        Task<User> GetUserByApodoAsync(string apodo);
        Task AddUserAsync(User user);
        Task<string> StoreImageAsync(IFormFile file, string avatarName);
        Task UpdateUserAsync(User user);

    }
}
