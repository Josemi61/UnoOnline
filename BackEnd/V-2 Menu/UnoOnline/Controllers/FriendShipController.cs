using Microsoft.AspNetCore.Mvc;
using UnoOnline.Repositories;

namespace UnoOnline.Controllers
{
    [Route("api/friendship")]
    [ApiController]
    public class FriendshipController : ControllerBase
    {
        private readonly IFriendshipRepository _friendshipRepository;

        public FriendshipController(IFriendshipRepository friendshipRepository)
        {
            _friendshipRepository = friendshipRepository;
        }

        [HttpGet("friends/{userId}")]
        public async Task<IActionResult> GetFriends(int userId)
        {
            var friends = await _friendshipRepository.GetFriends(userId);

            if (friends == null || friends.Count == 0)
                return NotFound(new { message = "No friends request for this user." });

            var result = friends.Select(f => new
            {
                f.Id,
                f.Apodo,
                f.Email,
                f.Avatar
            });

            return Ok(result);
        }
    }
}
