namespace AmigosGramProject.Server.DTOs
{
    public class RespondToRequestDTO
    {
        public string ContactId { get; set; }
        public string Action { get; set; } // "Accept", "Decline", "Block"
    }

}
