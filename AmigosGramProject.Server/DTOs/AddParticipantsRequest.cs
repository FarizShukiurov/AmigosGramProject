namespace AmigosGramProject.Server.DTOs
{
    public class AddParticipantsRequest
    {
        public Guid GroupId { get; set; }
        public List<ParticipantDto> Participants { get; set; }
    }
}
