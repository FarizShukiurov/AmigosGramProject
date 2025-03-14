﻿using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Hubs;
using AmigosGramProject.Server.Models;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private readonly ChatDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly string _connectionString;

        public MessageController(ChatDbContext context, IHubContext<ChatHub> hubContext, IConfiguration configuration)
        {
            _context = context;
            _hubContext = hubContext;
            _connectionString = configuration.GetSection("Azure:BlobStorage:ConnectionString").Value;
        }
        private string GetChatGroupId(string senderId, string receiverId)
        {
            return string.Compare(senderId, receiverId) < 0
                ? $"{senderId}-{receiverId}"
                : $"{receiverId}-{senderId}";
        }
        [HttpDelete("delete-file")]
        public async Task<bool> DeleteFileFromStorage(string blobUrl)
        {
            try
            {
                // Извлечение имени контейнера и имени блоба из URL
                Uri uri = new Uri(blobUrl);
                string blobName = uri.AbsolutePath.Substring(1); // Удалить начальный '/'
                string containerName = blobName.Split('/')[0];
                blobName = blobName.Substring(containerName.Length + 1);

                Console.WriteLine($"Blob URL: {blobUrl}");
                Console.WriteLine($"Container Name: {containerName}");
                Console.WriteLine($"Blob Name: {blobName}");

                BlobServiceClient blobServiceClient = new BlobServiceClient(_connectionString);
                BlobContainerClient containerClient = blobServiceClient.GetBlobContainerClient(containerName);
                BlobClient blobClient = containerClient.GetBlobClient(blobName);

                // Удаление блоба
                var response = await blobClient.DeleteIfExistsAsync();

                Console.WriteLine($"Blob Deletion Status: {response.Value}");
                return response.Value;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting blob: {ex.Message}");
                return false;
            }
        }



        // Метод для создания нового сообщения
        [HttpPost("createMessage")]
        public async Task<IActionResult> CreateMessage([FromBody] MessageDTO messageDto)
        {
            var message = new Message
            {
                SenderId = messageDto.SenderId,
                ReceiverId = messageDto.ReceiverId,
                EncryptedForSender = messageDto.EncryptedForSender,
                EncryptedForReceiver = messageDto.EncryptedForReceiver,
                MessageType = messageDto.MessageType,
                Timestamp = DateTime.Now,
                MediaUrlsForSender = messageDto.MediaUrlsForSender,
                FileUrlsForSender = messageDto.FileUrlsForSender,
                MediaUrlsForReceiver = messageDto.MediaUrlsForReceiver,
                FileUrlsForReceiver = messageDto.FileUrlsForReceiver,
                AudioUrlForSender = messageDto.AudioUrlForSender,
                AudioUrlForReceiver = messageDto.AudioUrlForReceiver,
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            try
            {
                await _hubContext.Clients.Group(GetChatGroupId(messageDto.SenderId, messageDto.ReceiverId)).SendAsync("ReceiveMessage", message);
                await _hubContext.Clients.Group($"User_{messageDto.ReceiverId}").SendAsync("UpdateLastMessage", messageDto.SenderId, message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SignalR error: {ex.Message}");
                return StatusCode(500, $"SignalR error: {ex.Message}");
            }

            return Ok(message);
        }
        [HttpPost("createGroupMessage")]
        public async Task<IActionResult> CreateGroupMessage([FromBody] GroupMessageDTO groupMessageDto)
        {
            var groupMessage = new GroupMessage
            {
                GroupId = groupMessageDto.GroupId,
                SenderId = groupMessageDto.SenderId,
                EncryptedContent = groupMessageDto.EncryptedContent,
                MessageType = groupMessageDto.MessageType,
                Timestamp = DateTime.Now,
                EncryptedMediaUrls = groupMessageDto.EncryptedMediaUrls,
                EncryptedFileUrls = groupMessageDto.EncryptedFileUrls,
                EncryptedAudioUrl = groupMessageDto.EncryptedAudioUrl
            };

            _context.GroupMessages.Add(groupMessage);
            await _context.SaveChangesAsync();

            try
            {
                // Отправка группового сообщения всем участникам через SignalR.
                // Здесь формируется название группы, например "Group_{GroupId}".
                await _hubContext.Clients.Group($"Group_{groupMessage.GroupId}")
                                     .SendAsync("ReceiveGroupMessage", groupMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SignalR error: {ex.Message}");
                return StatusCode(500, $"SignalR error: {ex.Message}");
            }

            return Ok(groupMessage);
        }
        [HttpPut("UpdateGroupMessages")]
        public async Task<IActionResult> UpdateGroupMessages([FromBody] UpdateGroupMessagesRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.GroupId) || request.Messages == null)
            {
                return BadRequest("Invalid request");
            }

            // Если GroupId в модели GroupMessage имеет тип int, приводим строку к int:

            foreach (var msgDto in request.Messages)
            {
                // Ищем существующее сообщение по ID и GroupId
                var existingMessage = await _context.GroupMessages
                    .FirstOrDefaultAsync(m => m.Id == msgDto.Id && m.GroupId == request.GroupId);
                if (existingMessage != null)
                {
                    existingMessage.EncryptedContent = msgDto.EncryptedContent;
                    existingMessage.MessageType = msgDto.MessageType;
                    existingMessage.EncryptedMediaUrls = msgDto.EncryptedMediaUrls;
                    existingMessage.EncryptedFileUrls = msgDto.EncryptedFileUrls;
                    existingMessage.EncryptedAudioUrl = msgDto.EncryptedAudioUrl;
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Messages updated");
        }


        [HttpGet("getAllMessages")]
        public async Task<IActionResult> GetAllMessages()
        {
            var messages = await _context.Messages.ToListAsync();
            return Ok(messages);
        }

        [HttpGet("getGroupMessages")]
        public async Task<IActionResult> GetGroupMessages([FromQuery] string groupId)
        {
            // Получаем сообщения группы, сортируя по времени (от старых к новым)
            var messages = await _context.GroupMessages
                                         .Where(m => m.GroupId == groupId)
                                         .OrderBy(m => m.Timestamp)
                                         .ToListAsync();

            // Если сообщений нет, можно вернуть NoContent или пустой список
            if (messages == null || messages.Count == 0)
            {
                return NoContent();
            }

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
                return Ok(new List<Message>()); // Возвращаем пустой массив вместо null
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
                lastMessage.EncryptedForReceiver,
                lastMessage.AudioUrlForReceiver,
                lastMessage.FileUrlsForReceiver,
                lastMessage.MediaUrlsForReceiver,
            });
        }

        [HttpGet("getLastGroupMessage/{groupId}")]
        public async Task<IActionResult> GetLastGroupMessage(string groupId)
        {
            var lastMessage = await _context.GroupMessages
                .Where(m => m.GroupId == groupId)
                .OrderByDescending(m => m.Timestamp)
                .FirstOrDefaultAsync();

            if (lastMessage == null)
            {
                return Ok(null);
            }

            return Ok(new
            {
                lastMessage.Id,
                lastMessage.GroupId,
                lastMessage.SenderId,
                lastMessage.Timestamp,
                lastMessage.EncryptedContent,
                lastMessage.MessageType,
                lastMessage.EncryptedMediaUrls,
                lastMessage.EncryptedFileUrls,
                lastMessage.EncryptedAudioUrl
            });
        }


        [HttpDelete("deleteGroupMessage/{id}")]
        public async Task<IActionResult> DeleteGroupMessage(int id, [FromBody] DeleteMessageDto dto)
        {
            // Ищем групповое сообщение по id
            var groupMessage = await _context.GroupMessages.FindAsync(id);
            if (groupMessage == null)
            {
                return NotFound("Group message not found.");
            }

            Console.WriteLine($"ID: {id}");
            Console.WriteLine($"DTO: {JsonConvert.SerializeObject(dto)}");

            try
            {
                // Удаляем переданные расшифрованные ссылки на медиа-файлы
                if (dto.MediaUrls != null && dto.MediaUrls.Any())
                {
                    foreach (var mediaUrl in dto.MediaUrls)
                    {
                        await DeleteFileFromStorage(mediaUrl);
                    }
                }

                if (dto.FileUrls != null && dto.FileUrls.Any())
                {
                    foreach (var fileUrl in dto.FileUrls)
                    {
                        await DeleteFileFromStorage(fileUrl);
                    }
                }

                if (!string.IsNullOrWhiteSpace(dto.AudioUrl))
                {
                    await DeleteFileFromStorage(dto.AudioUrl);
                }

                // Удаляем групповое сообщение из базы данных
                _context.GroupMessages.Remove(groupMessage);
                await _context.SaveChangesAsync();

                // Уведомляем участников группы через SignalR
                await _hubContext.Clients.Group($"Group_{groupMessage.GroupId}")
                    .SendAsync("FetchGroupMessages");

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting group message: {ex.Message}");
                return StatusCode(500, "An error occurred while deleting the group message.");
            }
        }




        [HttpPut("editMessageById/{id}")]
        public async Task<IActionResult> EditMessageById(int id, [FromBody] EditMessageDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Request body is required.");
            }

            var message = await _context.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound();
            }

            // Обновляем текст
            if (dto.EncryptedForSender != null) // Даже если текст пустой, обновляем
            {
                message.EncryptedForSender = dto.EncryptedForSender;
            }
            else if (dto.EncryptedForSender == null) // Обнуляем текст, если он явно стёрт
            {
                message.EncryptedForSender = null;
            }

            if (dto.EncryptedForReceiver != null) // Аналогично для получателя
            {
                message.EncryptedForReceiver = dto.EncryptedForReceiver;
            }
            else if (dto.EncryptedForReceiver == null)
            {
                message.EncryptedForReceiver = null;
            }

            // Обновляем медиа, если они переданы
            if (dto.MediaUrlsForSender != null)
            {
                message.MediaUrlsForSender = dto.MediaUrlsForSender;
            }

            if (dto.FileUrlsForSender != null)
            {
                message.FileUrlsForSender = dto.FileUrlsForSender;
            }

            if (dto.AudioUrlForSender != null)
            {
                message.AudioUrlForSender = dto.AudioUrlForSender;
            }

            if (dto.MediaUrlsForReceiver != null)
            {
                message.MediaUrlsForReceiver = dto.MediaUrlsForReceiver;
            }

            if (dto.FileUrlsForReceiver != null)
            {
                message.FileUrlsForReceiver = dto.FileUrlsForReceiver;
            }

            if (dto.AudioUrlForReceiver != null)
            {
                message.AudioUrlForReceiver = dto.AudioUrlForReceiver;
            }

            try
            {
                _context.Messages.Update(message);
                await _context.SaveChangesAsync();

                var chatGroupId = GetChatGroupId(message.SenderId, message.ReceiverId);
                await _hubContext.Clients.Group(chatGroupId).SendAsync("UpdateMessage", message);

                return Ok(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating message: {ex.Message}");
                return StatusCode(500, "An error occurred while updating the message.");
            }
        }
        [HttpPut("editGroupMessage/{id}")]
        public async Task<IActionResult> EditGroupMessage(int id, [FromBody] EditGroupMessageDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Request body is required.");
            }

            // Находим групповое сообщение по id
            var groupMessage = await _context.GroupMessages.FindAsync(id);
            if (groupMessage == null)
            {
                return NotFound("Group message not found.");
            }

            // Обновляем зашифрованное содержимое сообщения
            if (dto.EncryptedContent != null) // даже если текст пустой, обновляем
            {
                groupMessage.EncryptedContent = dto.EncryptedContent;
            }
            else if (dto.EncryptedContent == null)
            {
                groupMessage.EncryptedContent = null;
            }

            // Обновляем зашифрованные медиа-данные, если они переданы
            if (dto.EncryptedMediaUrls != null)
            {
                groupMessage.EncryptedMediaUrls = dto.EncryptedMediaUrls;
            }

            if (dto.EncryptedFileUrls != null)
            {
                groupMessage.EncryptedFileUrls = dto.EncryptedFileUrls;
            }

            if (dto.EncryptedAudioUrl != null)
            {
                groupMessage.EncryptedAudioUrl = dto.EncryptedAudioUrl;
            }

            try
            {
                _context.GroupMessages.Update(groupMessage);
                await _context.SaveChangesAsync();

                // Уведомляем участников группы через SignalR
                await _hubContext.Clients.Group($"Group_{groupMessage.GroupId}")
                    .SendAsync("FetchGroupMessages");

                return Ok(groupMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating group message: {ex.Message}");
                return StatusCode(500, "An error occurred while updating the group message.");
            }
        }


    }
}
