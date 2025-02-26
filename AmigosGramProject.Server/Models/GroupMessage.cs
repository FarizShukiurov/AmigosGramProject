namespace AmigosGramProject.Server.Models
{
    public class GroupMessage
    {
        public int Id { get; set; }
        public string GroupId { get; set; }  // изменено с int на string
        public string SenderId { get; set; }
        public string? EncryptedContent { get; set; }
        public MessageType MessageType { get; set; }
        public List<string>? EncryptedMediaUrls { get; set; } = null;
        public List<string>? EncryptedFileUrls { get; set; } = null;
        public string? EncryptedAudioUrl { get; set; } = null;
        public DateTime Timestamp { get; set; }
    }
}
