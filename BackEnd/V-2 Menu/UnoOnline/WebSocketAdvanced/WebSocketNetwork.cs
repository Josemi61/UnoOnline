using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Collections.Concurrent;

namespace UnoOnline.WebSocketAdvanced;

public class WebSocketNetwork
{
    private static readonly ConcurrentDictionary<int, WebSocketHandler> _clients = new();
    private static int _clientCounter = 0;
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public async Task HandleAsync(WebSocket webSocket)
    {
        var handler = await AddClientAsync(webSocket);
        await NotifyConnectionStatusAsync(handler, "connected");
        await handler.HandleAsync();
    }

    private async Task<WebSocketHandler> AddClientAsync(WebSocket webSocket)
    {
        await _semaphore.WaitAsync();
        try
        {
            var handler = new WebSocketHandler(_clientCounter++, webSocket);
            handler.Disconnected += OnDisconnectedAsync;
            handler.MessageReceived += OnMessageReceivedAsync;
            _clients[handler.Id] = handler;
            return handler;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private async Task OnDisconnectedAsync(WebSocketHandler handler)
    {
        await _semaphore.WaitAsync();
        try
        {
            _clients.TryRemove(handler.Id, out _);
        }
        finally
        {
            _semaphore.Release();
        }
        await NotifyConnectionStatusAsync(handler, "disconnected");
    }

    private async Task OnMessageReceivedAsync(WebSocketHandler handler, string message)
    {
        var data = JsonSerializer.Deserialize<WebSocketMessage>(message);
        if (data?.Type == "friend_request")
        {
            await SendFriendRequestAsync(handler.Id, data.TargetId);
        }
    }

    private async Task SendFriendRequestAsync(int senderId, int targetId)
    {
        if (_clients.TryGetValue(targetId, out var targetHandler))
        {
            var requestMessage = new WebSocketMessage
            {
                Type = "friend_request_received",
                SenderId = senderId
            };
            await targetHandler.SendAsync(JsonSerializer.Serialize(requestMessage));
        }
    }

    private async Task NotifyConnectionStatusAsync(WebSocketHandler handler, string status)
    {
        var message = new WebSocketMessage
        {
            Type = "status_update",
            SenderId = handler.Id,
            Status = status
        };
        foreach (var client in _clients.Values)
        {
            await client.SendAsync(JsonSerializer.Serialize(message));
        }
    }
}

public class WebSocketMessage
{
    public string Type { get; set; }
    public int SenderId { get; set; }
    public int TargetId { get; set; }
    public string Status { get; set; }
}
