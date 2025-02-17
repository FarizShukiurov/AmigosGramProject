﻿using AmigosGramProject.Server.Models;

namespace AmigosGramProject.Server.DTOs
{
    public class ContactRequestDTO
    {
        public string ContactId { get; set; }
        public string UserName { get; set; }
        public string AvatarUrl { get; set; }
        
        public ContactStatus  Status  { get; set; }
    }
}
