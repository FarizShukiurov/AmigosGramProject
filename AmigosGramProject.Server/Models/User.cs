using Microsoft.AspNetCore.Identity;

namespace AmigosGramProject.Server.Models
{
    public class User : IdentityUser
    {
        public string? AvatarUrl { get; set; }
        public ICollection<UserContact> Contacts { get; set; } = new List<UserContact>();
    }
}
