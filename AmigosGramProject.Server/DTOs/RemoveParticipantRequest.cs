namespace AmigosGramProject.Server.DTOs
{
    public class RemoveParticipantRequest
    {
        public Guid GroupId { get; set; }                // Идентификатор группы
        public string ParticipantId { get; set; }          // Идентификатор участника, которого нужно удалить
        public string SenderId { get; set; }               // Идентификатор отправителя (для проверки прав админа)
        public List<ParticipantDto> UpdatedParticipants { get; set; } // Список с обновлёнными данными ключей для оставшихся участников
    }

}
