using UnoOnline.Repositories;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using UnoOnline.Models;
using UnoOnline.Interfaces;

namespace UnoOnline.WebSockets;

public class WebSocketHandler
{
    private static readonly ConcurrentDictionary<string, WebSocket> _connections = new();
    private readonly IServiceScopeFactory _scopeFactory;

    public WebSocketHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task HandleWebSocketAsync(WebSocket webSocket, string userId)
    {
        if (_connections.TryGetValue(userId, out var existingSocket))
        {
            if (existingSocket.State == WebSocketState.Open)
            {
                await existingSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Cerrando conexión duplicada", CancellationToken.None);
            }
            _connections.TryRemove(userId, out _);
        }
        //if (_connections.ContainsKey(userId))
        //{
        //    Console.WriteLine($"🔄 Usuario {userId} ya está conectado.");
        //    return;
        //}

        _connections[userId] = webSocket;

        var buffer = new byte[1024 * 4];
        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                var receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (receiveResult.CloseStatus.HasValue)
                {
                    break;
                }

                string message = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);
                Console.WriteLine($"📥 Recibido: {message} de {userId}");

                var messageParts = message.Split('|');
                if (messageParts.Length != 2)
                {
                    Console.WriteLine("⚠️ Formato inválido. Debe ser 'TipoMensaje|Datos'");
                    continue;
                }

                string messageType = messageParts[0];
                string requestData = messageParts[1];

                switch (messageType)
                {
                    case "FriendRequest":
                        await HandleFriendRequest(requestData);
                        break;
                    case "FriendRequestResponse":
                        await HandleFriendRequestResponse(requestData);
                        break;
                    case "StatusUpdate":
                        await HandleStatusUpdate(requestData);
                        break;
                    default:
                        Console.WriteLine($"⚠️ Tipo de mensaje desconocido: {messageType}");
                        break;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en WebSocket: {ex.Message}");
        }
        finally
        {
            _connections.TryRemove(userId, out _);
            if (webSocket.State == WebSocketState.Open)
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Conexión cerrada por el servidor", CancellationToken.None);
            }
        }
    }

    private async Task HandleStatusUpdate(string request)
    {
        // Dividir los datos recibidos por la coma
        var requestParts = request.Split(',');

        // Verificar que el mensaje tiene exactamente dos partes (userId y status)
        if (requestParts.Length != 2)
        {
            Console.WriteLine("⚠️ Formato inválido para StatusUpdate. Debe ser 'userId,newStatus'");
            return;
        }

        // Convertir los valores a enteros (userId y status)
        if (!int.TryParse(requestParts[0], out int userId) || !int.TryParse(requestParts[1], out int newStatus))
        {
            Console.WriteLine("⚠️ Error en la conversión de los datos. Asegúrese de que los valores sean enteros.");
            return;
        }

        // Verificar que el estado es válido (0, 1, 2)
        if (newStatus < 0 || newStatus > 2)
        {
            Console.WriteLine($"⚠️ Estado inválido recibido: {newStatus}. Debe ser 0 (Desconectado), 1 (Conectado) o 2 (Jugando).");
            return;
        }

        // Procesar el cambio de estado del usuario
        using (var scope = _scopeFactory.CreateScope())
        {
            var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();

            // Obtener el usuario por su Id
            var user = await userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"⚠️ Usuario con ID {userId} no encontrado.");
                return;
            }

            // Cambiar el estado del usuario
            user.Status = (StatusUser)newStatus;

            // Guardar los cambios en la base de datos
            await userRepository.UpdateUserAsync(user);

            Console.WriteLine($"✅ Estado del usuario {userId} actualizado a {newStatus}");

            // Enviar el mensaje a los otros usuarios conectados (broadcast)
            await BroadcastStatus(userId, newStatus);
        }
    }




    private async Task BroadcastStatus(int userId, int newStatus)
    {
        var message = $"StatusUpdate|{userId},{newStatus}";
        var bytes = Encoding.UTF8.GetBytes(message);

        // Enviar el mensaje a todos los clientes conectados
        foreach (var connection in _connections.Values)
        {
            if (connection.State == WebSocketState.Open)
            {
                await connection.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        Console.WriteLine($"📤 Enviado mensaje de actualización de estado: {message}");
    }




    // ✅ Procesar solicitudes de amistad
    private async Task HandleFriendRequest(string requestData)
    {
        var requestParts = requestData.Split(',');
        if (requestParts.Length != 2)
        {
            Console.WriteLine("⚠️ Formato inválido para FriendRequest. Debe ser 'FriendRequest|senderId,receiverId'");
            return;
        }

        int senderId = int.Parse(requestParts[0]);
        int receiverId = int.Parse(requestParts[1]);

        using (var scope = _scopeFactory.CreateScope())
        {
            var friendshipRepository = scope.ServiceProvider.GetRequiredService<IFriendshipRepository>();

            if (await friendshipRepository.RequestExists(senderId, receiverId))
            {
                Console.WriteLine("⏳ La solicitud de amistad ya existe.");
                return;
            }

            var request = new FriendRequest
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Status = RequestStatus.Pending
            };

            await friendshipRepository.AddRequest(request);
            Console.WriteLine($"✅ Solicitud de amistad enviada de {senderId} a {receiverId}");
        }

        if (_connections.TryGetValue(receiverId.ToString(), out var webSocket) && webSocket.State == WebSocketState.Open)
        {
            string message = $"FriendRequest|{senderId}";
            var bytes = Encoding.UTF8.GetBytes(message);
            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
        }
    }

    // ✅ Procesar respuestas de solicitudes de amistad
    private async Task HandleFriendRequestResponse(string requestData)
    {
        var dataParts = requestData.Split(',');
        if (dataParts.Length != 2)
        {
            Console.WriteLine("⚠️ Formato inválido para FriendRequestResponse. Debe ser 'FriendRequestResponse|requestId,accepted'");
            return;
        }

        int requestId = int.Parse(dataParts[0]);
        bool accepted = bool.Parse(dataParts[1]);

        using (var scope = _scopeFactory.CreateScope())
        {
            var friendshipRepository = scope.ServiceProvider.GetRequiredService<IFriendshipRepository>();
            var request = await friendshipRepository.GetRequestById(requestId);

            if (request == null)
            {
                Console.WriteLine($"❌ No se encontró la solicitud con ID {requestId}");
                return;
            }

            request.Status = accepted ? RequestStatus.Accepted : RequestStatus.Rejected;
            await friendshipRepository.UpdateRequest(request);

            Console.WriteLine($"✅ Solicitud {requestId} {(accepted ? "ACEPTADA" : "RECHAZADA")}");
        }
    }
}
