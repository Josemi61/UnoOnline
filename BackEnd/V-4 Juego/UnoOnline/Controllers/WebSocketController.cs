using System.Net.WebSockets;
using Microsoft.AspNetCore.Mvc;
using UnoOnline.WebSockets;

namespace UnoOnline.Controllers
{
    [Route("api/websocket")]
    [ApiController]
    public class WebSocketController : ControllerBase
    {
        private readonly WebSocketHandler _webSocketHandler;
        private readonly IServiceScopeFactory _scopeFactory;

        public WebSocketController(WebSocketHandler webSocketHandler, IServiceScopeFactory serviceScopeFactory)
        {
            _webSocketHandler = webSocketHandler;
            _scopeFactory = serviceScopeFactory;
        }

        [HttpGet("connected-users")]
        public IActionResult GetConnectedUsers()
        {
            int connectedUsers = _webSocketHandler.GetConnectedUsers();
            return Ok(new { connectedUsers });
        }

        [HttpGet("connect")]
        public async Task ConnectAsync()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                string? userId = HttpContext.Request.Query["userId"].ToString();

                if (string.IsNullOrEmpty(userId))
                {
                    HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await HttpContext.Response.WriteAsync("Error: userId es requerido.");
                    return;
                }
                WebSocket webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                Console.WriteLine($"Usuario {userId} intentando conectar...");
                await _webSocketHandler.HandleWebSocketAsync(webSocket, userId);
            }
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }
        }
    }
}


