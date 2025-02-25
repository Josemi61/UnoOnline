using Microsoft.EntityFrameworkCore;
using System;
using UnoOnline.Models.Memory;

namespace UnoOnline.Models
{
    public class Card
    {
        public int Id { get; set; } // Added Id property
        public int Value { get; set; }
        public bool IsFlipped { get; set; }
        public bool IsMatched { get; set; }
        public Guid MemoryGameId { get; set; } // Relación con MemoryGame
        public MemoryGame MemoryGame { get; set; }

        public class DataBaseContext : DbContext
        {
            public DbSet<Card> Cards { get; set; }

            protected override void OnModelCreating(ModelBuilder modelBuilder)
            {
                modelBuilder.Entity<Card>().HasKey(c => c.Id); // Assuming 'Id' is the primary key property
            }
        }
    }
}
