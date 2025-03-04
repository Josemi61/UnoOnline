using UnoOnline.Models;
using System.Threading.Tasks;

namespace UnoOnline.Interfaces
{
    public interface IGameRoomRepository
    {
        Task<GameRoom> CreateRoomAsync(int hostId);
        Task<GameRoom?> GetRoomByIdAsync(string roomId);
        Task<bool> AddGuestToRoomAsync(string roomId, int guestId);
        Task<bool> RemoveRoomAsync(string roomId);
        Task<GameRoom?> GetAvailableRoomAsync();
        Task<bool> ConvertRoomToBotGameAsync(string roomId);
        Task<bool> EndGameAsync(string roomId);
        Task<bool> DeleteRoomAsync(string roomId);
    }
}
