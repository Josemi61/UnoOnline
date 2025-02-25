using Microsoft.EntityFrameworkCore;
using UnoOnline.Models;
using UnoOnline.Models.Memory;

namespace UnoOnline.Data
{
    public class DataBaseContext : DbContext
    {
        private const string DATABASE_PATH = "uno.db";

        public DbSet<User> Users { get; set; }
        public DbSet<FriendRequest> FriendRequests { get; set; }
        public DbSet<GameRoom> GameRooms { get; set; }
        public DbSet<GameResult> GameResults { get; set; }
        public DbSet<MemoryGame> MemoryGames { get; set; }
        public DbSet<Card> Card { get; set; }

        public DataBaseContext(DbContextOptions<DataBaseContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<FriendRequest>()
                .HasOne(fr => fr.Sender)
                .WithMany()
                .HasForeignKey(fr => fr.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FriendRequest>()
                .HasOne(fr => fr.Receiver)
                .WithMany()
                .HasForeignKey(fr => fr.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MemoryGame>()
                .HasMany(mg => mg.Board)
                .WithOne(c => c.MemoryGame)
                .HasForeignKey(c => c.MemoryGameId);

            modelBuilder.Entity<Card>()
                .ToTable("Card");
        }
    }
}