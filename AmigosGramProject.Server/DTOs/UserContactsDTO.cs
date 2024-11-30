using AmigosGramProject.Server.Models;

namespace AmigosGramProject.Server.DTOs
{
    public class UserContactsDTO
    {
        public string Id { get; set; }            // Идентификатор пользователя
        public ContactStatus Status { get; set; }  // Статус контакта (например, "Accepted", "Pending", "Blocked")
    }

}
