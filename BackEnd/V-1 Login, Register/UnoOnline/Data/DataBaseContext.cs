using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Metadata;
using UnoOnline.Models;

namespace UnoOnline.Data
{
    public class DataBaseContext : DbContext
    {
        private const string DATABASE_PATH = "uno.db";

        public DbSet<User> Users { get; set; }

        //public DataBaseContext(DbContextOptions<DataBaseContext> options) : base(options) { }

        //protected override void OnConfiguring(DbContextOptionsBuilder options)
        //{
        //    if (!options.IsConfigured)
        //    {
        //        options.UseSqlite($"Data Source={DATABASE_PATH}");
        //    }
        //}

        //protected override void OnModelCreating(ModelBuilder modelBuilder)
        //{
        //    base.OnModelCreating(modelBuilder);

        //    modelBuilder.Entity<User>()
        //        .HasIndex(u => u.Email)
        //        .IsUnique();

        //}


        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");
        }

    }
}
