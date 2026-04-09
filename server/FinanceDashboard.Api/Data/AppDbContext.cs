using Microsoft.EntityFrameworkCore;
using FinanceDashboard.Api.Models;

namespace FinanceDashboard.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
            
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(user => user.Name)
                    .HasMaxLength(100);

                entity.Property(user => user.Email)
                    .HasMaxLength(256);

                entity.Property(user => user.PasswordHash)
                    .HasMaxLength(512);

                entity.HasIndex(user => user.Email)
                    .IsUnique();
            });

            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.Property(transaction => transaction.Description)
                    .HasMaxLength(120);

                entity.Property(transaction => transaction.Category)
                    .HasMaxLength(60);

                entity.Property(transaction => transaction.Type)
                    .HasMaxLength(20);

                entity.ToTable(table =>
                    table.HasCheckConstraint(
                        "CK_Transactions_Type",
                        "[Type] IN ('income', 'expense')"));
            });

            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.Property(token => token.TokenHash)
                    .HasMaxLength(128);

                entity.HasIndex(token => token.TokenHash)
                    .IsUnique();

                entity.HasIndex(token => token.UserId);

                entity.HasOne(token => token.User)
                    .WithMany(user => user.PasswordResetTokens)
                    .HasForeignKey(token => token.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
