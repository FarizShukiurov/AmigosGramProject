namespace AmigosGramProject.Server.DTOs
{
    public class RemoveParticipantsRequest
    {
        public Guid GroupId { get; set; }                   // Идентификатор группы
        public string SenderId { get; set; }                // Идентификатор отправителя (админа группы)
        public List<string> ParticipantIds { get; set; }    // Список идентификаторов участников, которых нужно удалить
        public List<ParticipantDto> UpdatedParticipants { get; set; } // Список обновлённых ключей для оставшихся участников
    }
}
