using UnoOnline.DTO;
using UnoOnline.Models;

namespace UnoOnline.DataMappers
{
    public class UserMapper
    {
        public UserDTO userToDTO(User user)
        {
            return new UserDTO
            {
                Id = user.Id,
                Avatar = user.Avatar,
                Apodo = user.Apodo,
                Email = user.Email,
            };
        }

        public IEnumerable<UserDTO> usersToDTO(IEnumerable<User> users)
        {
            return users.Select(userToDTO);
        }

    }
}
