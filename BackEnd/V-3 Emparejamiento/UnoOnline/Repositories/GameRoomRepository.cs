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

        public async Task<GameRoom?> GetAvailableRoomAsync()
        {
            return await _context.GameRooms.FirstOrDefaultAsync(r => r.GuestId == null && r.IsActive);
        }

        public async Task<bool> ConvertRoomToBotGameAsync(string roomId)
        {
            var room = await _context.GameRooms.FirstOrDefaultAsync(r => r.RoomId == roomId && r.IsActive);

            if (room == null)
            {
                Console.WriteLine($"❌ No se encontró una sala activa con ID {roomId}.");
                return false;
            }

            if (room.GuestId != null && room.GuestId != 0)
            {
                Console.WriteLine($"⚠️ La sala ya tiene un invitado asignado (GuestId={room.GuestId}), no se puede convertir.");
                return false;
            }

            room.GuestId = -1; // Asignar el bot como oponente
            _context.Entry(room).State = EntityState.Modified; // Asegurar que se detecta el cambio
            await _context.SaveChangesAsync();

            // Confirmar que se guardó correctamente
            var updatedRoom = await _context.GameRooms.FirstOrDefaultAsync(r => r.RoomId == roomId);
            Console.WriteLine($"🔍 Verificación post-actualización: GuestId={updatedRoom?.GuestId}");

            return updatedRoom?.GuestId == -1;
        }

    }
}

