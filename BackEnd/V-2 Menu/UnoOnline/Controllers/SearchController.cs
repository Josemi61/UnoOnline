using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Text;
using UnoOnline.DTO;
using UnoOnline.Interfaces;

namespace UnoOnline.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public SearchController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpPost("Search")]
        public async Task<IActionResult> SearchAsync([FromBody] Search request)
        {
            if (string.IsNullOrWhiteSpace(request.Apodo))
            {
                var todosUsers = await _userRepository.GetUsersAsync();
                var allUsersDTO = todosUsers
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    Apodo = u.Apodo,
                    Avatar = u.Avatar,
                    Email = u.Email
                })
                .ToList();

                return Ok(allUsersDTO);
            }

            try
            {
                // Obtener todos los usuarios desde el repositorio
                var users = await _userRepository.GetUsersAsync();

                // Verifica que hay usuarios en la base de datos
                if (users == null || !users.Any())
                {
                    return NotFound("No hay usuarios disponibles para buscar.");
                }

                // Normalizar la cadena de búsqueda para ignorar tildes y mayúsculas/minúsculas
                string normalizedSearch = RemoveDiacritics(request.Apodo.ToLowerInvariant());

                // Filtrar amigos cuyos apodos contengan la cadena normalizada
                var matchingUsers = users
                    .Where(u => !string.IsNullOrWhiteSpace(u.Apodo) && // Evitar errores si algún apodo es nulo
                                RemoveDiacritics(u.Apodo.ToLowerInvariant()).Contains(normalizedSearch))
                    .Select(u => new UserDTO
                    {
                        Id = u.Id,
                        Apodo = u.Apodo,
                        Avatar = u.Avatar,
                        Email = u.Email
                    })
                    .ToList();

                if (!matchingUsers.Any())
                {
                    return NotFound("No se encontraron amigos que coincidan con la búsqueda.");
                }

                return Ok(matchingUsers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        private static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
