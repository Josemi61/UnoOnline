using UnoOnline.Models;
using UnoOnline.Data;
using Microsoft.EntityFrameworkCore;
using System;
using UnoOnline.Interfaces;

namespace UnoOnline.Repositories
{
    public class GameRoomRepository : IGameRoomRepository
    {
        private readonly DataBaseContext _context;

        public GameRoomRepository(DataBaseContext context)
        {
            _context = context;
        }

        public async Task<GameRoom> CreateRoomAsync(int hostId)
        {
            var room = new GameRoom { HostId = hostId };
            _context.GameRooms.Add(room);
            await _context.SaveChangesAsync();
            return room;
        }

        public async Task<GameRoom?> GetRoomByIdAsync(string roomId)
        {
            return await _context.GameRooms.FirstOrDefaultAsync(r => r.RoomId == roomId);
        }

        public async Task<bool> AddGuestToRoomAsync(string roomId, int guestId)
        {
            var room = await GetRoomByIdAsync(roomId);
            if (room == null || room.GuestId != null)
                return false;

            room.GuestId = guestId;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveRoomAsync(string roomId)
        {
            var room = await GetRoomByIdAsync(roomId);
            if (room == null)
                return false;

            _context.GameRooms.Remove(room);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

