using Microsoft.AspNetCore.Identity;

namespace AmigosGramProject.Server.Models
{
    public class User : IdentityUser
    {
        public ICollection<UserContact> Contacts { get; set; } = new List<UserContact>();
    }
}
