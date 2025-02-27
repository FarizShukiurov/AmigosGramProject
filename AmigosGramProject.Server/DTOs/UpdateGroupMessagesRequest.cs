namespace AmigosGramProject.Server.DTOs
{
    public class UpdateGroupMessagesRequest
    {
        public string GroupId { get; set; }
        public List<GroupMessageDTO> Messages { get; set; }
    }
}
