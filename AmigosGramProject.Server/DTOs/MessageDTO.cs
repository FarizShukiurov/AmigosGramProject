using AmigosGramProject.Server.Models;

namespace AmigosGramProject.Server.DTOs
{
    public class MessageDTO
    {
        public string SenderId { get; set; }
        public string ReceiverId { get; set; }
        public string Content { get; set; }
        public MessageType MessageType { get; set; }
        public string? ImageUrl { get; set; } = null;
    }
}
