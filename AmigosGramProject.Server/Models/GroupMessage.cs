namespace AmigosGramProject.Server.Models
{
    public class GroupMessage
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public string SenderId { get; set; }
        public string? EncryptedContent { get; set; }
        public DateTime Timestamp { get; set; }
        public MessageType MessageType { get; set; }
        public List<string>? EncryptedMediaUrls { get; set; } = null;
        public List<string>? EncryptedFileUrls { get; set; } = null;
        public string? EncryptedAudioUrl { get; set; } = null;
    }
}
