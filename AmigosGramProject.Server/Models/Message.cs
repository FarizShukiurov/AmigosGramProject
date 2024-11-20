namespace AmigosGramProject.Server.Models
{
    public enum MessageType
    {
        Text,      
        Image,
        File
    }

    public class Message
    {
        public int Id { get; set; }                 
        public string SenderId { get; set; }        
        public string ReceiverId { get; set; }      
        public string EncryptedForSender { get; set; } // Зашифровано для отправителя
        public string EncryptedForReceiver { get; set; }    
        public DateTime Timestamp { get; set; }     
        public MessageType MessageType { get; set; }
        public List<string>? MediaUrls { get; set; } = null;
        public List<string>? FileUrls { get; set; } = null;
    }

}
