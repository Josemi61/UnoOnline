using UnoOnline.Repositories;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using UnoOnline.Models;
using UnoOnline.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;

namespace UnoOnline.WebSockets;

public class WebSocketHandler
{
    private static readonly ConcurrentDictionary<string, WebSocket> _connections = new();
    private static readonly ConcurrentDictionary<string, GameRoom> _gameRooms = new();
    private static int _connectedUsers = 0;
    private readonly IServiceScopeFactory _scopeFactory;

    public WebSocketHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public int GetConnectedUsers() => _connectedUsers;

    public async Task HandleWebSocketAsync(WebSocket webSocket, string userId)
    {
        if (_connections.TryGetValue(userId, out var existingSocket))
        {
            if (existingSocket.State == WebSocketState.Open)
            {
                Console.WriteLine($"🔄 Usuario {userId} ya está conectado. Cerrando conexión duplicada.");
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
        Interlocked.Increment(ref _connectedUsers);
        Console.WriteLine($"🔄 Usuario {userId} conectado. Total conectados: {_connectedUsers}");

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
                    case "CreateRoom":
                        await HandleCreateRoom(requestData);
                        break;
                    case "InviteFriend":
                        await HandleInviteFriend(requestData);
                        break;
                    case "JoinGame":
                        await HandleJoinGame(requestData);
                        break;
                    case "PlayAgainstBot":
                        await HandlePlayAgainstBot(requestData);
                        break;
                    case "JoinRandomRoom":
                        await HandleJoinRandomRoom(requestData);
                        break;
                    case "EndGame":
                        await HandleEndGame(requestData);
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
            Interlocked.Decrement(ref _connectedUsers);
            Console.WriteLine($"❌ Usuario {userId} desconectado. Total conectados: {_connectedUsers}");
            if (webSocket.State == WebSocketState.Open)
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Conexión cerrada por el servidor", CancellationToken.None);
            }
        }
    }

    private async Task HandleEndGame(string requestData)
    {
        if (string.IsNullOrWhiteSpace(requestData))
        {
            Console.WriteLine("⚠️ Formato inválido para EndGame. Debe ser 'EndGame|roomId'");
            return;
        }

        string roomId = requestData;

        using (var scope = _scopeFactory.CreateScope())
        {
            var gameRoomRepository = scope.ServiceProvider.GetRequiredService<IGameRoomRepository>();

            bool success = await gameRoomRepository.EndGameAsync(roomId);

            if (success)
            {
                Console.WriteLine($"✅ Partida {roomId} finalizada y marcada como inactiva.");
            }
            else
            {
                Console.WriteLine($"❌ No se pudo finalizar la partida {roomId}.");
            }
        }
    }



    private async Task HandleJoinRandomRoom(string requestData)
    {
        if (!int.TryParse(requestData, out int playerId))
        {
            Console.WriteLine("⚠️ Formato inválido para JoinRandomRoom. Debe ser 'JoinRandomRoom|playerId'");
            return;
        }

        using (var scope = _scopeFactory.CreateScope())
        {
            var gameRoomRepository = scope.ServiceProvider.GetRequiredService<IGameRoomRepository>();

            // Buscar una sala disponible
            var availableRoom = await gameRoomRepository.GetAvailableRoomAsync();

            if (availableRoom != null)
            {
                // Unir al jugador a la sala
                bool joined = await gameRoomRepository.AddGuestToRoomAsync(availableRoom.RoomId, playerId);
                if (!joined)
                {
                    Console.WriteLine($"❌ No se pudo unir el jugador {playerId} a la sala {availableRoom.RoomId}");
                    return;
                }

                Console.WriteLine($"✅ Jugador {playerId} unido a la sala {availableRoom.RoomId}");

                // Notificar a ambos jugadores
                NotifyPlayersGameStarted(availableRoom.HostId, playerId, availableRoom.RoomId);
            }
            else
            {
                // Crear una nueva sala si no hay disponibles
                var newRoom = await gameRoomRepository.CreateRoomAsync(playerId);

                Console.WriteLine($"🆕 Creada nueva sala {newRoom.RoomId} para jugador {playerId}, esperando oponente...");
            }
        }
    }


    // Función para notificar a ambos jugadores cuando la partida empieza
    private async void NotifyPlayersGameStarted(int hostId, int guestId, string roomId)
    {
        foreach (var playerId in new[] { hostId, guestId })
        {
            if (_connections.TryGetValue(playerId.ToString(), out var webSocket) && webSocket.State == WebSocketState.Open)
            {
                string message = $"GameStarted|{roomId},{hostId},{guestId}";
                var bytes = Encoding.UTF8.GetBytes(message);
                await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }
    }


    private async Task HandlePlayAgainstBot(string requestData)
    {
        Console.WriteLine($"📩 Mensaje recibido: '{requestData}'");

        // Verificamos que requestData contiene solo roomId
        if (string.IsNullOrEmpty(requestData))
        {
            Console.WriteLine("⚠️ El mensaje recibido está vacío.");
            return;
        }

        // El mensaje recibido solo tiene roomId, así que lo tratamos como 'PlayAgainstBot|roomId'
        string formattedMessage = $"PlayAgainstBot|{requestData}";
        Console.WriteLine($"🔍 Formato correcto: '{formattedMessage}'");

        // Ahora partimos el mensaje correctamente
        var parts = formattedMessage.Split('|', StringSplitOptions.RemoveEmptyEntries);
        Console.WriteLine($"🔍 Partes del mensaje después de split: {string.Join(", ", parts)}");

        if (parts.Length != 2 || !parts[0].Equals("PlayAgainstBot", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine($"⚠️ Formato inválido para PlayAgainstBot. Recibido: '{formattedMessage}', esperado: 'PlayAgainstBot|roomId'");
            return;
        }

        string roomId = parts[1].Trim(); // Asegúrate de eliminar los espacios en blanco
        Console.WriteLine($"🔍 roomId extraído: '{roomId}'");

        if (string.IsNullOrEmpty(roomId))
        {
            Console.WriteLine("⚠️ roomId no puede estar vacío.");
            return;
        }

        using (var scope = _scopeFactory.CreateScope())
        {
            var gameRoomRepository = scope.ServiceProvider.GetRequiredService<IGameRoomRepository>();

            // Crear una nueva sala con el bot (-1 como GuestId)
            bool success = await gameRoomRepository.ConvertRoomToBotGameAsync(roomId);

            if (success)
            {
                Console.WriteLine($"🤖 Sala con ID {roomId} convertida en partida contra el bot.");

                // Notificar al host
                var message = $"GameUpdated|{roomId},BOT";
                var bytes = Encoding.UTF8.GetBytes(message);

                if (_connections.TryGetValue(roomId, out var webSocket) && webSocket.State == WebSocketState.Open)
                {
                    await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
            else
            {
                Console.WriteLine($"❌ No se pudo convertir la sala con ID {roomId} en una partida contra el bot.");
            }
        }
    }






    private async Task HandleCreateRoom(string requestData)
    {
        var requestParts = requestData.Split(',');
        if (requestParts.Length != 1)
        {
            Console.WriteLine("⚠️ Formato inválido para CreateRoom. Debe ser 'CreateRoom|userId'");
            return;
        }

        int hostId;
        if (!int.TryParse(requestParts[0], out hostId))
        {
            Console.WriteLine("⚠️ ID de usuario inválido.");
            return;
        }

        using (var scope = _scopeFactory.CreateScope())
        {
            var repository = scope.ServiceProvider.GetRequiredService<GameRoomRepository>();
            var room = await repository.CreateRoomAsync(hostId);

            Console.WriteLine($"✅ Sala creada por {hostId}. ID: {room.RoomId}");

            if (_connections.TryGetValue(hostId.ToString(), out var socket) && socket.State == WebSocketState.Open)
            {
                string message = $"RoomCreated|{room.RoomId}";
                await socket.SendAsync(Encoding.UTF8.GetBytes(message), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }
    }

    private async Task HandleInviteFriend(string requestData)
    {
        var parts = requestData.Split(',');
        if (parts.Length != 2)
        {
            Console.WriteLine("⚠️ Formato inválido para InviteFriend. Debe ser 'InviteFriend|roomId,friendId'");
            return;
        }

        string roomId = parts[0];
        int friendId;
        if (!int.TryParse(parts[1], out friendId))
        {
            Console.WriteLine("⚠️ ID de amigo inválido.");
            return;
        }

        if (_connections.TryGetValue(friendId.ToString(), out var friendSocket) && friendSocket.State == WebSocketState.Open)
        {
            string message = $"Invitation|{roomId}";
            await friendSocket.SendAsync(Encoding.UTF8.GetBytes(message), WebSocketMessageType.Text, true, CancellationToken.None);
            Console.WriteLine($"📩 Invitación enviada a {friendId} para la sala {roomId}");
        }
    }

    private async Task HandleJoinGame(string requestData)
    {
        var parts = requestData.Split(',');
        if (parts.Length != 2)
        {
            Console.WriteLine("⚠️ Formato inválido para JoinGame. Debe ser 'JoinGame|userId,roomId'");
            return;
        }

        int guestId;
        if (!int.TryParse(parts[0], out guestId))
        {
            Console.WriteLine("⚠️ ID de usuario inválido.");
            return;
        }

        string roomId = parts[1];

        using (var scope = _scopeFactory.CreateScope())
        {
            var repository = scope.ServiceProvider.GetRequiredService<GameRoomRepository>();
            bool success = await repository.AddGuestToRoomAsync(roomId, guestId);

            if (!success)
            {
                Console.WriteLine($"❌ No se pudo unir {guestId} a la sala {roomId}");
                return;
            }

            Console.WriteLine($"✅ {guestId} se unió a la sala {roomId}");

            if (_connections.TryGetValue(guestId.ToString(), out var guestSocket) && guestSocket.State == WebSocketState.Open)
            {
                string message = $"JoinedGame|{roomId}";
                await guestSocket.SendAsync(Encoding.UTF8.GetBytes(message), WebSocketMessageType.Text, true, CancellationToken.None);
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
