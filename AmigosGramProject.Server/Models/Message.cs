namespace AmigosGramProject.Server.Models
{
    public enum MessageType
    {
        Text,      
        Image      
    }

    public class Message
    {
        public int Id { get; set; }                 
        public string SenderId { get; set; }        
        public string ReceiverId { get; set; }      
        public string Content { get; set; }        
        public DateTime Timestamp { get; set; }     
        public MessageType MessageType { get; set; }
        public string? MediaUrl { get; set; } = null;      
    }

}
