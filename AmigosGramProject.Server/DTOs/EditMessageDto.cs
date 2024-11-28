namespace AmigosGramProject.Server.DTOs
{
    public class EditMessageDto
    {
        public string? EncryptedForSender { get; set; }
        public string? EncryptedForReceiver { get; set; }
        public List<string>? MediaUrlsForSender { get; set; }
        public List<string>? FileUrlsForSender { get; set; }
        public string? AudioUrlForSender { get; set; }
        public List<string>? MediaUrlsForReceiver { get; set; }
        public List<string>? FileUrlsForReceiver { get; set; }
        public string? AudioUrlForReceiver { get; set; }
    }

}
