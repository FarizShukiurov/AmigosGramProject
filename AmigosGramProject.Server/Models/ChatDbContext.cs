using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AmigosGramProject.Server.Models
{
    public class ChatDbContext : IdentityDbContext<User>
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options) {}

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }
    }
}
