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
        public DbSet<FinancialAccount> FinancialAccounts { get; set; }
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

                entity.Property(transaction => transaction.Source)
                    .HasMaxLength(30);

                entity.Property(transaction => transaction.SourceReference)
                    .HasMaxLength(120);

                entity.Property(transaction => transaction.RecurrenceGroupId)
                    .HasMaxLength(40);

                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_Transactions_Source",
                        "[Source] IN ('manual', 'import_csv', 'import_ofx', 'bank_sync')");

                    table.HasCheckConstraint(
                        "CK_Transactions_Type",
                        "[Type] IN ('income', 'expense')");
                });

                entity.HasIndex(transaction => new { transaction.UserId, transaction.RecurrenceGroupId });
                entity.HasIndex(transaction => new { transaction.UserId, transaction.Source, transaction.SourceReference });

                entity.HasOne(transaction => transaction.FinancialAccount)
                    .WithMany(account => account.Transactions)
                    .HasForeignKey(transaction => transaction.FinancialAccountId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<FinancialAccount>(entity =>
            {
                entity.Property(account => account.Provider)
                    .HasMaxLength(40);

                entity.Property(account => account.InstitutionName)
                    .HasMaxLength(120);

                entity.Property(account => account.InstitutionCode)
                    .HasMaxLength(40);

                entity.Property(account => account.AccountName)
                    .HasMaxLength(120);

                entity.Property(account => account.AccountMask)
                    .HasMaxLength(32);

                entity.Property(account => account.ExternalAccountId)
                    .HasMaxLength(120);

                entity.Property(account => account.ProviderItemId)
                    .HasMaxLength(120);

                entity.Property(account => account.Status)
                    .HasMaxLength(30);

                entity.ToTable(table =>
                    table.HasCheckConstraint(
                        "CK_FinancialAccounts_Status",
                        "[Status] IN ('disconnected', 'pending', 'connected', 'error')"));

                entity.HasIndex(account => new { account.UserId, account.ExternalAccountId });
                entity.HasIndex(account => new { account.UserId, account.ProviderItemId });
                entity.HasIndex(account => new { account.UserId, account.Provider, account.InstitutionName });

                entity.HasOne(account => account.User)
                    .WithMany(user => user.FinancialAccounts)
                    .HasForeignKey(account => account.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
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
