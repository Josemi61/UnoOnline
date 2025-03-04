using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Text;
using UnoOnline.DTO;
using UnoOnline.Interfaces;
using UnoOnline.Models;
using UnoOnline.Repositories;

namespace UnoOnline.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly FriendshipRepository _friendshipRepository;

        public SearchController(IUserRepository userRepository, FriendshipRepository friendshipRepository)
        {
            _userRepository = userRepository;
            _friendshipRepository = friendshipRepository;
        }

        [HttpPost("Search/{id}")]
        public async Task<IActionResult> SearchAsync([FromBody] Search request, int id)
        {
            if (string.IsNullOrWhiteSpace(request.Apodo))
            {
                var todosUsers = await _userRepository.GetUsersExceptAsync(id);
                var allUsersDTO = todosUsers
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    Apodo = u.Apodo,
                    Avatar = u.Avatar,
                    Email = u.Email,
                    Status = u.Status.ToString()
                })
                .ToList();

                return Ok(allUsersDTO);
            }

            try
            {

                var users = await _userRepository.GetUsersExceptAsync(id);


                if (users == null || !users.Any())
                {
                    return NotFound("No hay usuarios disponibles para buscar.");
                }


                string normalizedSearch = RemoveDiacritics(request.Apodo.ToLowerInvariant());


                var matchingUsers = users
                    .Where(u => !string.IsNullOrWhiteSpace(u.Apodo) && 
                                RemoveDiacritics(u.Apodo.ToLowerInvariant()).Contains(normalizedSearch))
                    .Select(u => new UserDTO
                    {
                        Id = u.Id,
                        Apodo = u.Apodo,
                        Avatar = u.Avatar,
                        Email = u.Email,
                        Status = u.Status.ToString()
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

        [HttpPost("SearchAmigos/{id}")]
        public async Task<IActionResult> SearchAmigosAsync([FromBody] Search request, int id)
        {
            if (string.IsNullOrWhiteSpace(request.Apodo))
            {
                var todosUsers = await _friendshipRepository.GetFriends(id);
                var allUsersDTO = todosUsers
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    Apodo = u.Apodo,
                    Avatar = u.Avatar,
                    Email = u.Email,
                    Status = u.Status.ToString()
                })
                .ToList();

                return Ok(allUsersDTO);
            }

            try
            {
                var users = await _friendshipRepository.GetFriends(id);

                if (users == null || !users.Any())
                {
                    return NotFound("No hay usuarios disponibles para buscar.");
                }

                string normalizedSearch = RemoveDiacritics(request.Apodo.ToLowerInvariant());

                var matchingUsers = users
                    .Where(u => !string.IsNullOrWhiteSpace(u.Apodo) &&
                                RemoveDiacritics(u.Apodo.ToLowerInvariant()).Contains(normalizedSearch))
                    .Select(u => new UserDTO
                    {
                        Id = u.Id,
                        Apodo = u.Apodo,
                        Avatar = u.Avatar,
                        Email = u.Email,
                        Status = u.Status.ToString()
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
