// Models/User.cs
using System;
using System.Collections.Generic;

namespace AmigosGramProject.Server.Models
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string AvatarUrl { get; set; } = "https://blobcontaineramigos.blob.core.windows.net/avatars/AvatarDefault.svg";
        public string Bio { get; set; } = "Hi, This is my bio";
        public List<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<UserContact> Contacts { get; set; } = new List<UserContact>();
    }

    public class RefreshToken
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Token { get; set; }
        public DateTime Expires { get; set; }
        public bool IsRevoked { get; set; }
        public bool IsExpired => DateTime.UtcNow >= Expires;
        public string UserId { get; set; }
        public User User { get; set; }
    }
}
