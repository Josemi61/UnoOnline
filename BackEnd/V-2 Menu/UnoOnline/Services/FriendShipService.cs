using System.Collections.Generic;
using System.Threading.Tasks;
using UnoOnline.Repositories;
using UnoOnline.Models;

namespace Memory.Service
{
    public class FriendshipService
    {
        private readonly IFriendshipRepository _friendshipRepository;

        public FriendshipService(IFriendshipRepository friendshipRepository)
        {
            _friendshipRepository = friendshipRepository;
        }

        public async Task<bool> SendFriendRequest(int senderId, int receiverId)
        {
            if (await _friendshipRepository.RequestExists(senderId, receiverId))
                return false;

            var request = new FriendRequest
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Status = RequestStatus.Pending
            };

            await _friendshipRepository.AddRequest(request);
            return true;
        }

        public async Task<List<FriendRequest>> GetPendingRequests(int userId)
        {
            return await _friendshipRepository.GetPendingRequests(userId);
        }

        public async Task<bool> RespondToRequest(int requestId, bool accepted)
        {
            var request = await _friendshipRepository.GetRequestById(requestId);
            if (request == null) return false;

            request.Status = accepted ? RequestStatus.Accepted : RequestStatus.Rejected;
            await _friendshipRepository.UpdateRequest(request);

            return true;
        }

    }
}
