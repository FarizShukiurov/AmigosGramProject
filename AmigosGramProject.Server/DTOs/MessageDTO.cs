using AmigosGramProject.Server.Models;

namespace AmigosGramProject.Server.DTOs
{
    public class MessageDTO
    {
        public string SenderId { get; set; }
        public string ReceiverId { get; set; }
        public string EncryptedForSender { get; set; }
        public string EncryptedForReceiver { get; set; }
        public MessageType MessageType { get; set; }
        public List<string>? MediaUrlsForSender { get; set; } = null;
        public List<string>? FileUrlsForSender { get; set; } = null; 
        public List<string>? MediaUrlsForReceiver { get; set; } = null; 
        public List<string>? FileUrlsForReceiver { get; set; } = null;
    }
}
