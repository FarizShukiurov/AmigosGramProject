using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AmigosGramProject.Server.Models
{
    public class ChatDbContext : IdentityDbContext<User>
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options) { }
        public DbSet<UserContact> UserContacts { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

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
        }
    }
}
