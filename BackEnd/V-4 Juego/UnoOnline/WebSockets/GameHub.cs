
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace UnoOnline.WebSockets
{
    public class GameHub : Hub
    {
        public async Task JoinGame(string gameId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
        }
    }
}