using Microsoft.AspNetCore.Mvc;
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

        public UserController(IUserRepository userRepository, UserMapper userMapper)
        {
            _userRepository = userRepository;
            _mapper = userMapper;
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
    }
}
