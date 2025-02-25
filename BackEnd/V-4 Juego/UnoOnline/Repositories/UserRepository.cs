using Microsoft.EntityFrameworkCore;
using UnoOnline.Data;
using UnoOnline.Interfaces;
using UnoOnline.Models;
namespace UnoOnline.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly DataBaseContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public UserRepository(DataBaseContext context, IPasswordHasher hasher)
        {
            _context = context;
            _passwordHasher = hasher;
        }

        public async Task AddUserAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User> GetUserByApodoAsync(string apodo)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Apodo == apodo);
        }

        public async Task<User> GetUserByIdAsync(long id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<ICollection<User>> GetUsersAsync()
        {
            return await _context.Users.OrderBy(u => u.Id).ToListAsync();
        }

        public async Task<ICollection<User>> GetUsersExceptAsync(long userId)
        {
            return await _context.Users
                .Where(u => u.Id != userId)
                .OrderBy(u => u.Id)
                .ToListAsync();
        }


        public async Task<string> StoreImageAsync(IFormFile file, string apodo)
        {
            string fileExtension = Path.GetExtension(file.FileName);
            string fileName = apodo + fileExtension;

            string imagesFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");

            string filePath = Path.Combine(imagesFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return fileName;
        }

        public async Task UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }


    }
}
