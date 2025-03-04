using System.Collections.Generic;
using System.Net.WebSockets;
using System.Text.Json;
using System.Threading.Tasks;

namespace UnoOnline.GameLogic
{
    public class Player
    {
        public string Name { get; }
        public WebSocket Socket { get; }
        public List<Card> Hand { get; }

        public Player(string name, WebSocket socket, List<Card> hand)
        {
            Name = name;
            Socket = socket;
            Hand = hand;
        }

        public async Task SendMessage(string message)
        {
            if (Socket.State == WebSocketState.Open)
            {
                var buffer = new ArraySegment<byte>(System.Text.Encoding.UTF8.GetBytes(message));
                await Socket.SendAsync(buffer, WebSocketMessageType.Text, true, System.Threading.CancellationToken.None);
            }
        }
    }
}
