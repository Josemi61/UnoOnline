using System.Net.WebSockets;
using Microsoft.AspNetCore.Mvc;
using UnoOnline.WebSockets;

namespace UnoOnline.Controllers
{
    [Route("api/websocket")]
    [ApiController]
    //[Authorize]
    public class WebSocketController : ControllerBase
    {
        private readonly WebSocketHandler _webSocketHandler;
        private readonly IServiceScopeFactory _scopeFactory;

        public WebSocketController(WebSocketHandler webSocketHandler, IServiceScopeFactory serviceScopeFactory)
        {
            _webSocketHandler = webSocketHandler;
            _scopeFactory = serviceScopeFactory;
        }

        [HttpGet("connect")]
        public async Task ConnectAsync()
        {
            // Si la petición es de tipo websocket la aceptamos
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                string? userId = HttpContext.Request.Query["userId"].ToString();

                if (string.IsNullOrEmpty(userId))
                {
                    HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await HttpContext.Response.WriteAsync("❌ Error: userId es requerido.");
                    return;
                }
                // Aceptamos la solicitud
                WebSocket webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                Console.WriteLine($"✅ Usuario {userId} intentando conectar...");
                // Manejamos la solicitud.
                await _webSocketHandler.HandleWebSocketAsync(webSocket, userId); // Cambiado a HandleWebSocketAsync
            }
            // En caso contrario la rechazamos
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }

            // Cuando este método finalice, se cerrará automáticamente la conexión con el websocket
        }
    }
}


