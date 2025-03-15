namespace AmigosGramProject.Server.DTOs
{
    public class EditGroupMessageDto
    {
        public string EncryptedContent { get; set; }
        public List<string> EncryptedMediaUrls { get; set; }
        public List<string> EncryptedFileUrls { get; set; }
        public string EncryptedAudioUrl { get; set; }
    }
}
