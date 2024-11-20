using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Hubs;
using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

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
                EncryptedForReceiver = messageDto.EncryptedForReceiver,
                EncryptedForSender = messageDto.EncryptedForSender,
                MessageType = messageDto.MessageType,
                Timestamp = DateTime.Now,
                MediaUrls = messageDto.MediaUrls, // Добавляем URL, если это сообщение с картинкой
                FileUrls = messageDto.FileUrls // Добавляем URL, если это сообщение с картинкой
            };

            // Сохраняем сообщение в базе данных
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Отправляем сообщение получателю через SignalR
            try
            {
                await _hubContext.Clients.User(message.ReceiverId).SendAsync("ReceiveMessage", message);
            }catch (Exception ex) 
            {
                Console.WriteLine($"SignalR error: {ex.Message}");
                return StatusCode(500, $"SignalR error: {ex.Message}");
            }

            return Ok(message);
        }

        [HttpGet("getAllMessages")]
        public async Task<IActionResult> GetAllMessages()
        {
            var messages = await _context.Messages.ToListAsync();
            return Ok(messages);
        }

        [HttpGet("getMessagesBetweenUsers")]
        public async Task<IActionResult> GetMessagesBetweenUsers(string userId1, string userId2)
        {
            var messages = await _context.Messages
                .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                            (m.SenderId == userId2 && m.ReceiverId == userId1))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            if (messages.Count == 0)
            {
                return Ok(null);
            }

            return Ok(messages);
        }

        [HttpGet("getLastMessageBetweenUsers")]
        public async Task<IActionResult> GetLastMessageBetweenUsers(string userId1, string userId2)
        {
            var lastMessage = await _context.Messages
                .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                            (m.SenderId == userId2 && m.ReceiverId == userId1))
                .OrderByDescending(m => m.Timestamp)
                .FirstOrDefaultAsync();

            if (lastMessage == null)
            {
                return Ok(null);
            }

            // Возвращаем зашифрованные данные и дополнительную информацию
            return Ok(new
            {
                lastMessage.Id,
                lastMessage.SenderId,
                lastMessage.ReceiverId,
                lastMessage.Timestamp,
                lastMessage.EncryptedForSender,
                lastMessage.EncryptedForReceiver
            });
        }


    }
}
