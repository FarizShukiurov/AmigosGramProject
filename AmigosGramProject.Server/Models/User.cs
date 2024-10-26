using Microsoft.AspNetCore.Identity;

namespace AmigosGramProject.Server.Models
{
    public class User : IdentityUser
    {
        public string AvatarUrl { get; set; } = "https://blobcontaineramigos.blob.core.windows.net/avatars/AvatarDefault.svg";
        public ICollection<UserContact> Contacts { get; set; } = new List<UserContact>();
        public string Bio { get; set; } = "Hi, This is my bio"; // Default value
    }
}
