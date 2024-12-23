using Microsoft.EntityFrameworkCore;
using System;

namespace AmigosGramProject.Server.Models
{
    public class ChatDbContext : DbContext
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<UserContact> UserContacts { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Define the User primary key
            builder.Entity<User>()
                .HasKey(u => u.Id);

            builder.Entity<UserContact>()
                .HasKey(uc => new { uc.UserId, uc.ContactId });

            builder.Entity<UserContact>()
                .HasOne(uc => uc.User)
                .WithMany(u => u.Contacts)
                .HasForeignKey(uc => uc.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<UserContact>()
                .HasOne(uc => uc.Contact)
                .WithMany()
                .HasForeignKey(uc => uc.ContactId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.Entity<UserContact>()
                .Property(uc => uc.Status)
                .IsRequired();
        }
    }
}
