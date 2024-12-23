namespace AmigosGramProject.Server.DTOs
{
    public class CreateGroupDto
    {
        public string Name { get; set; } // Название группы
        public string Description { get; set; } // Описание группы (необязательно)
        public string AdminId { get; set; } // ID администратора группы
        public List<ParticipantDto> Participants { get; set; } // Список участников
    }
}
