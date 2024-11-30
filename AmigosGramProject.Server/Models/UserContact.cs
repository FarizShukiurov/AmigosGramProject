namespace AmigosGramProject.Server.Models
{
    public class UserContact
    {
        public string? UserId { get; set; }
        public User? User { get; set; }

        public string? ContactId { get; set; }
        public User? Contact { get; set; }

        public ContactStatus Status { get; set; } // Статус запроса
    }

    public enum ContactStatus
    {
        Pending,     // Ожидает принятия
        Accepted,    // Принят
        Declined,    // Отклонен
        Blocked      // Заблокирован
    }

}
