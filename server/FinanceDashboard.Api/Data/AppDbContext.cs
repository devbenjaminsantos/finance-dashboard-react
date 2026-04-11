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
        public DbSet<BudgetGoal> BudgetGoals { get; set; }
        public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

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

                entity.Property(transaction => transaction.RecurrenceGroupId)
                    .HasMaxLength(40);

                entity.ToTable(table =>
                    table.HasCheckConstraint(
                        "CK_Transactions_Type",
                        "[Type] IN ('income', 'expense')"));

                entity.HasIndex(transaction => new { transaction.UserId, transaction.RecurrenceGroupId });
            });

            modelBuilder.Entity<BudgetGoal>(entity =>
            {
                entity.Property(goal => goal.Month)
                    .HasMaxLength(7);

                entity.Property(goal => goal.Category)
                    .HasMaxLength(60);

                entity.HasIndex(goal => new { goal.UserId, goal.Month, goal.Category })
                    .IsUnique();

                entity.HasOne(goal => goal.User)
                    .WithMany(user => user.BudgetGoals)
                    .HasForeignKey(goal => goal.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
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

            modelBuilder.Entity<EmailVerificationToken>(entity =>
            {
                entity.Property(token => token.TokenHash)
                    .HasMaxLength(128);

                entity.HasIndex(token => token.TokenHash)
                    .IsUnique();

                entity.HasIndex(token => token.UserId);

                entity.HasOne(token => token.User)
                    .WithMany(user => user.EmailVerificationTokens)
                    .HasForeignKey(token => token.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.Property(log => log.Action)
                    .HasMaxLength(80);

                entity.Property(log => log.EntityType)
                    .HasMaxLength(80);

                entity.Property(log => log.EntityId)
                    .HasMaxLength(64);

                entity.Property(log => log.Summary)
                    .HasMaxLength(400);

                entity.Property(log => log.IpAddress)
                    .HasMaxLength(64);

                entity.HasIndex(log => new { log.UserId, log.CreatedAtUtc });

                entity.HasOne(log => log.User)
                    .WithMany(user => user.AuditLogs)
                    .HasForeignKey(log => log.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
