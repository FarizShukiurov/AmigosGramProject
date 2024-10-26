namespace AmigosGramProject.Server.DTOs
{
    public class UserDTO
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string AvatarUrl { get; set; }

        public string Bio { get; set; } = "This user has not written a bio."; // Default value
    }

}
