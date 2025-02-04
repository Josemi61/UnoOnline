using System.Collections.Generic;
using System.Threading.Tasks;
using UnoOnline.Models;
using UnoOnline.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace UnoOnline.Repositories
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

    public class FriendshipRepository : IFriendshipRepository
    {
        private readonly DataBaseContext _context;

        public FriendshipRepository(DataBaseContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task AddRequest(FriendRequest request)
        {
            if (await RequestExists((int)request.SenderId, (int)request.ReceiverId))
            {
                Console.WriteLine($"⚠️ Friend Request already exists: Sender {request.SenderId}, Receiver {request.ReceiverId}");
                return;
            }

            try
            {
                Console.WriteLine($"📩 Adding Friend Request: Sender {request.SenderId}, Receiver {request.ReceiverId}");
                await _context.FriendRequests.AddAsync(request);
                await _context.SaveChangesAsync();
                Console.WriteLine("✅ Friend Request successfully saved in the database.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error saving Friend Request: {ex.Message}");
            }
        }

        public async Task<FriendRequest> GetRequestById(int requestId)
        {
            var request = await _context.FriendRequests.FirstOrDefaultAsync(r => r.Id == requestId);
            if (request == null)
            {
                Console.WriteLine($"⚠️ No Friend Request found with ID {requestId}");
            }
            return request;
        }

        public async Task<List<FriendRequest>> GetPendingRequests(int userId)
        {
            var pendingRequests = await _context.FriendRequests
                .Where(r => r.ReceiverId == userId && r.Status == RequestStatus.Pending)
                .ToListAsync();

            Console.WriteLine($"📌 Found {pendingRequests.Count} pending friend requests for user {userId}");
            return pendingRequests;
        }

        public async Task<bool> RequestExists(int senderId, int receiverId)
        {
            bool exists = await _context.FriendRequests.AnyAsync(r =>
                r.SenderId == senderId && r.ReceiverId == receiverId && r.Status == RequestStatus.Pending);

            Console.WriteLine($"🔍 Checking if Friend Request exists: Sender {senderId}, Receiver {receiverId} => Exists: {exists}");
            return exists;
        }

        public async Task UpdateRequest(FriendRequest request)
        {
            try
            {
                Console.WriteLine($"🔄 Updating Friend Request: ID {request.Id}, Status {request.Status}");
                _context.FriendRequests.Update(request);
                await _context.SaveChangesAsync();
                Console.WriteLine("✅ Friend Request successfully updated.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error updating Friend Request: {ex.Message}");
            }
        }

        public async Task<List<User>> GetFriends(int userId)
        {
            return await _context.FriendRequests
                .Where(r => (r.SenderId == userId || r.ReceiverId == userId) && r.Status == RequestStatus.Pending)
                .Select(r => r.SenderId == userId ? r.Receiver : r.Sender) // Recuperar el objeto User
                .ToListAsync();
        }
    }
}
