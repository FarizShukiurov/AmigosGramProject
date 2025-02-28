namespace AmigosGramProject.Server.DTOs
{
    public class UpdateGroupDto
    {
        public Guid GroupId { get; set; }      // Предполагаем, что идентификатор группы — Guid
        public string AdminId { get; set; }      // Идентификатор администратора (тот, кто меняет настройки)
        public string Name { get; set; }         // Новое имя группы
        public string Description { get; set; }  // Новое описание
        public string AvatarUrl { get; set; }    // Новый URL аватарки (можно обновлять)
    }
}
