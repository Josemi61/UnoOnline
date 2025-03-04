using UnoOnline.Models;

namespace UnoOnline.Interfaces
{
    public interface IFriendshipRepository
    {
        Task AddRequest(FriendRequest request);
        Task<FriendRequest> GetRequestById(int requestId);
        Task<List<FriendRequest>> GetPendingRequests(int userId);
        Task<bool> RequestExists(int senderId, int receiverId);
        Task UpdateRequest(FriendRequest request);
        Task<List<User>> GetFriends(int userId);
    }
}
