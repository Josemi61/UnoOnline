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

        public WebSocketController(WebSocketHandler webSocketHandler)
        {
            _webSocketHandler = webSocketHandler;
        }

        [HttpGet("connect")]
        public async Task ConnectAsync()
        {
            // Si la petición es de tipo websocket la aceptamos
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                // Aceptamos la solicitud
                WebSocket webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();

                // Manejamos la solicitud.
                await _webSocketHandler.HandleWebSocketAsync(webSocket, "userId"); // Cambiado a HandleWebSocketAsync
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


