namespace AmigosGramProject.Server.Models
{
    public enum MessageType
    {
        Text,      
        Image,
        File,
        Audio,
        Sticker
    }

    public class Message
    {
        public int Id { get; set; }                 
        public string SenderId { get; set; }        
        public string ReceiverId { get; set; }      
        public string? EncryptedForSender { get; set; }
        public string? EncryptedForReceiver { get; set; }    
        public DateTime Timestamp { get; set; }     
        public MessageType MessageType { get; set; }
        public List<string>? MediaUrlsForSender { get; set; } = null;
        public List<string>? FileUrlsForSender { get; set; } = null;
        public List<string>? MediaUrlsForReceiver { get; set; } = null;
        public List<string>? FileUrlsForReceiver { get; set; } = null;
        public string? AudioUrlForSender { get; set; } = null;
        public string? AudioUrlForReceiver { get; set; } = null;
        public string? StickerUrl { get; set; } = null;
    }

}
