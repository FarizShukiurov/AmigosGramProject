using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Hubs;
using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private readonly ChatDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public MessageController(ChatDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // Метод для создания нового сообщения
        [HttpPost("createMessage")]
        public async Task<IActionResult> CreateMessage([FromBody] MessageDTO messageDto)
        {
            // Создаем новое сообщение на основе DTO (переданных данных)
            var message = new Message
            {
                SenderId = messageDto.SenderId,
                ReceiverId = messageDto.ReceiverId,
                Content = messageDto.Content,
                MessageType = messageDto.MessageType,
                Timestamp = DateTime.Now,
                MediaUrl = messageDto.ImageUrl // Добавляем URL, если это сообщение с картинкой
            };

            // Сохраняем сообщение в базе данных
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Отправляем сообщение получателю через SignalR
            await _hubContext.Clients.User(message.ReceiverId).SendAsync("ReceiveMessage", message);

            return Ok(message);
        }
    }
}
