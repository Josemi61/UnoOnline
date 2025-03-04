using System.Text;
using System.Security.Cryptography;
using UnoOnline.Interfaces;

namespace UnoOnline.Models
{
    internal class PasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            byte[] inputBytes = Encoding.UTF8.GetBytes(password);
            byte[] inputHash = SHA256.HashData(inputBytes);
            return Convert.ToBase64String(inputHash);
        }
    }
}
