using System;
using System.Collections.Generic;

namespace AmigosGramProject.Server.DTOs
{
    public class AddParticipantsRequest
    {
        // Идентификатор группы, в которую добавляются участники
        public Guid GroupId { get; set; }
        
        // Список участников с зашифрованными ключами для группы
        public List<ParticipantDto> Participants { get; set; }
    }
}
