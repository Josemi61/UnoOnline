using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UnoOnline.Data;
using UnoOnline.DataMappers;
using UnoOnline.DTO;
using UnoOnline.Interfaces;
using UnoOnline.Models;

namespace UnoOnline.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController :ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly UserMapper _mapper;
        private readonly DataBaseContext _context;

        public UserController(IUserRepository userRepository, UserMapper userMapper, DataBaseContext context)
        {
            _userRepository = userRepository;
            _mapper = userMapper;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsersAsync()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var users = await _userRepository.GetUsersAsync();

                if (users == null || !users.Any())
                {
                    return NotFound("No users found.");
                }

                IEnumerable<UserDTO> usersDTO = _mapper.usersToDTO(users);

                return Ok(usersDTO);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserAsync(long id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            try
            {
                var user = await _userRepository.GetUserByIdAsync(id);

                if (user == null)
                {
                    return NotFound($"User with ID {id} not found.");
                }

                UserDTO userDTO = _mapper.userToDTO(user);

                return Ok(userDTO);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> AddUserAsync([FromForm] UserCreateDTO newUser)
        {
            if (newUser == null)
            {
                return BadRequest("Información necesaria no enviada.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingEmailUser = await _userRepository.GetUserByEmailAsync(newUser.Email);
            var existingApodolUser = await _userRepository.GetUserByApodoAsync(newUser.Apodo);
            if (existingEmailUser != null)
            {
                return Conflict("Email existente, por favor introduzca otro Email.");
            }

            if (existingApodolUser != null)
            {
                return Conflict("Apodo existente, por favor introduzca otro Apodo.");
            }

            try
            {
                var userToAdd = new User
                {
                    Id = newUser.Id,
                    Apodo = newUser.Apodo,
                    Email = newUser.Email,
                    Password = newUser.Password
                };

                if (newUser.Avatar != null)
                {
                    try
                    {
                        userToAdd.Avatar = await _userRepository.StoreImageAsync(newUser.Avatar, newUser.Apodo);
                    }
                    catch (Exception ex)
                    {
                        throw new Exception("Error al guardar la imagen: " + ex.Message);
                    }
                }
                else
                {
                    Random random = new Random();
                    int randomNumber = random.Next(1, 5);
                    userToAdd.Avatar = "Default" + randomNumber + ".png";
                }

                var passwordHasher = new PasswordHasher();
                userToAdd.Password = passwordHasher.Hash(userToAdd.Password);

                await _userRepository.AddUserAsync(userToAdd);

                return Ok(new { message = "Usuario registrado con éxito." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("{id}/{status}")]
        public async Task<IActionResult> ChangeStatus(long id, StatusUser status)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound("Usuario no encontrado");
            }

            if (!Enum.IsDefined(typeof(StatusUser), status))
            {
                return BadRequest("Estado no válido. Debe ser 0 (Desconectado), 1 (Conectado) o 2 (Jugando)");
            }

            user.Status = status;
            await _userRepository.UpdateUserAsync(user);

            return Ok("Estado actualizado correctamente");
        }

        [HttpPut("UpdateUser")]
        public async Task<IActionResult> UpdateUserAsync([FromForm] UserCreateDTO user)
        {
            if (user == null)
            {
                return BadRequest("Información necesaria no enviada.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userToUpdate = await _userRepository.GetUserByIdAsync(user.Id);
            if (userToUpdate == null)
            {
                return NotFound("Usuario no encontrado.");
            }

            if (!string.IsNullOrWhiteSpace(user.Email) && user.Email != userToUpdate.Email)
            {
                var existingEmailUser = await _userRepository.GetUserByEmailAsync(user.Email);
                if (existingEmailUser != null && existingEmailUser.Id != userToUpdate.Id)
                {
                    return Conflict("Email existente, por favor introduzca otro Email.");
                }
                userToUpdate.Email = user.Email;
            }

            if (!string.IsNullOrWhiteSpace(user.Apodo) && user.Apodo != userToUpdate.Apodo)
            {
                var existingApodoUser = await _userRepository.GetUserByApodoAsync(user.Apodo);
                if (existingApodoUser != null && existingApodoUser.Id != userToUpdate.Id)
                {
                    return Conflict("Apodo existente, por favor introduzca otro Apodo.");
                }
                userToUpdate.Apodo = user.Apodo;
            }

            if (!string.IsNullOrWhiteSpace(user.Password))
            {
                var passwordHasher = new PasswordHasher();
                userToUpdate.Password = passwordHasher.Hash(user.Password);
            }

            if (user.Avatar != null)
            {
                try
                {
                    userToUpdate.Avatar = await _userRepository.StoreImageAsync(user.Avatar,
                                                                               !string.IsNullOrWhiteSpace(user.Apodo) ? user.Apodo : userToUpdate.Apodo);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, "Error al guardar la imagen: " + ex.Message);
                }
            }

            try
            {
                _context.Users.Update(userToUpdate);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Usuario actualizado con éxito." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }


    }
}
