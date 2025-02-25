using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using UnoOnline.Data;
using UnoOnline.DTOs;
using UnoOnline.Models.Memory;
using UnoOnline.WebSockets;
using System.Linq;

namespace UnoOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MemoryGameController : ControllerBase
    {
        private readonly DataBaseContext _dbContext;
        private readonly IHubContext<GameHub> _hubContext;

        public MemoryGameController(DataBaseContext dbContext, IHubContext<GameHub> hubContext)
        {
            _dbContext = dbContext;
            _hubContext = hubContext;
        }

        [HttpPost("create")]
        public IActionResult CreateGame([FromBody] CreateGameRequest request)
        {
            var game = new MemoryGame(request.Player1, request.Player2, _dbContext);
            // Save the game to the database if needed
            return Ok(new { gameId = game.GameId });
        }

        [HttpPost("flip")]
        public IActionResult FlipCards([FromBody] FlipCardsRequest request)
        {
            var game = GetGameById(request.GameId);
            if (game == null)
                return NotFound("Game not found");

            var result = game.FlipCard(request.Index1, request.Index2, request.Player, _hubContext);
            return Ok(new { success = result });
        }

        [HttpGet("results/{gameId}")]
        public IActionResult GetGameResult(Guid gameId)
        {
            var gameResult = _dbContext.GameResults
                .Where(gr => gr.GameId == gameId)
                .Select(gr => new GameResultDto
                {
                    GameId = gr.GameId,
                    Player1 = gr.Player1,
                    Player2 = gr.Player2,
                    ScorePlayer1 = gr.ScorePlayer1,
                    ScorePlayer2 = gr.ScorePlayer2,
                    Winner = gr.Winner,
                    DatePlayed = gr.DatePlayed
                })
                .FirstOrDefault();

            if (gameResult == null)
                return NotFound("Game result not found");

            return Ok(gameResult);
        }

        private MemoryGame GetGameById(Guid gameId)
        {
            // Retrieve the game from the database or in-memory storage
            // This is a placeholder implementation
            return null;
        }
    }

    public class CreateGameRequest
    {
        public string Player1 { get; set; }
        public string Player2 { get; set; }
    }

    public class FlipCardsRequest
    {
        public Guid GameId { get; set; }
        public int Index1 { get; set; }
        public int Index2 { get; set; }
        public string Player { get; set; }
    }
}
