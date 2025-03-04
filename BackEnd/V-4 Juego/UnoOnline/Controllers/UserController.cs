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
            // Comprobación de errores de ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Intentar obtener los usuarios desde el repositorio
                var users = await _userRepository.GetUsersAsync();

                // Comprobar si la lista de usuarios es nula o está vacía
                if (users == null || !users.Any())
                {
                    return NotFound("No users found.");
                }

                // Creación del user DTO por cada User en la base de datos
                IEnumerable<UserDTO> usersDTO = _mapper.usersToDTO(users);

                return Ok(usersDTO);
            }
            catch (Exception ex)
            {
                // Captura cualquier error inesperado y devuelve una respuesta de error 500
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserAsync(long id)
        {
            // Verificar si el ID es válido
            if (id <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            try
            {
                // Intentar obtener el usuario desde el repositorio
                var user = await _userRepository.GetUserByIdAsync(id);

                // Comprobar si el usuario no existe
                if (user == null)
                {
                    return NotFound($"User with ID {id} not found.");
                }

                // Crear UserDTO según el User encontrado
                UserDTO userDTO = _mapper.userToDTO(user);

                return Ok(userDTO);
            }
            catch (Exception ex)
            {
                // Capturar cualquier error inesperado y devolver una respuesta de error 500
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

            // Convertir el número en un valor del enum
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

            // 1. Obtener el usuario existente por su Id
            var userToUpdate = await _userRepository.GetUserByIdAsync(user.Id);
            if (userToUpdate == null)
            {
                return NotFound("Usuario no encontrado.");
            }

            // 2. Actualizar Email solo si se provee uno nuevo y no vacío
            if (!string.IsNullOrWhiteSpace(user.Email) && user.Email != userToUpdate.Email)
            {
                var existingEmailUser = await _userRepository.GetUserByEmailAsync(user.Email);
                if (existingEmailUser != null && existingEmailUser.Id != userToUpdate.Id)
                {
                    return Conflict("Email existente, por favor introduzca otro Email.");
                }
                userToUpdate.Email = user.Email;
            }

            // 3. Actualizar Apodo solo si se provee uno nuevo y no vacío
            if (!string.IsNullOrWhiteSpace(user.Apodo) && user.Apodo != userToUpdate.Apodo)
            {
                var existingApodoUser = await _userRepository.GetUserByApodoAsync(user.Apodo);
                if (existingApodoUser != null && existingApodoUser.Id != userToUpdate.Id)
                {
                    return Conflict("Apodo existente, por favor introduzca otro Apodo.");
                }
                userToUpdate.Apodo = user.Apodo;
            }

            // 4. Actualizar la contraseña solo si se provee una nueva (no vacía)
            if (!string.IsNullOrWhiteSpace(user.Password))
            {
                var passwordHasher = new PasswordHasher();
                userToUpdate.Password = passwordHasher.Hash(user.Password);
            }

            // 5. Actualizar el avatar solo si se provee una nueva imagen (no vacía)
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
