using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupController : ControllerBase
    {
        private readonly ChatDbContext _context;

        public GroupController(ChatDbContext context)
        {
            _context = context;
        }

        // 1. Создание группы
        [HttpPost("create")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || dto.Participants == null || !dto.Participants.Any())
            {
                return BadRequest("Group name and participants are required.");
            }

            // Создаем объект группы
            var group = new Group
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                AdminId = dto.AdminId,
                CreatedDate = DateTime.UtcNow
            };

            // Добавление участников в коллекцию группы
            foreach (var participant in dto.Participants)
            {
                var member = new GroupMember
                {
                    Id = Guid.NewGuid(),
                    GroupId = group.Id,
                    GroupObj = group, // Связываем с группой
                    UserId = participant.UserId,
                    EncryptedGroupKey = participant.EncryptedGroupKey,
                    JoinedAt = DateTime.UtcNow
                };
                group.Members.Add(member); // Добавляем в коллекцию группы
            }

            // Сохраняем группу и участников
            _context.Groups.Add(group);
            await _context.SaveChangesAsync();

            return Ok(new { groupId = group.Id });
        }

        [HttpGet("GetUserGroups")]
        public async Task<IActionResult> GetUserGroups(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            var groups = await _context.Groups
                .Include(g => g.Members)
                .Where(g => g.Members.Any(m => m.UserId == userId))
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.Description,
                    ParticipantsCount = g.Members.Count
                })
                .ToListAsync();

            return Ok(groups);
        }

        [HttpGet("GetGroupMembers/{groupId}")]
        public async Task<IActionResult> GetGroupMembers(Guid groupId)
        {
            // Проверяем, существует ли группа с данным ID
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Формируем список участников группы
            var members = group.Members.Select(m => new
            {
                m.UserId,
                m.JoinedAt,
                m.EncryptedGroupKey
            }).ToList();

            return Ok(members);
        }

        // 2. Добавление новых участников с использованием DTO AddParticipantsRequest
        [HttpPost("AddParticipants")]
        public async Task<IActionResult> AddParticipants([FromBody] AddParticipantsRequest request)
        {
            // Находим группу по request.GroupId
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == request.GroupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Обрабатываем каждого участника из запроса
            foreach (var participant in request.Participants)
            {
                // Если участник уже присутствует, пропускаем
                if (!group.Members.Any(m => m.UserId == participant.UserId))
                {
                    var member = new GroupMember
                    {
                        Id = Guid.NewGuid(),
                        GroupId = group.Id,
                        GroupObj = group,
                        UserId = participant.UserId,
                        EncryptedGroupKey = participant.EncryptedGroupKey,
                        JoinedAt = DateTime.UtcNow
                    };
                    group.Members.Add(member);
                }
            }

            await _context.SaveChangesAsync();

            return Ok("Participants added successfully.");
        }

        // Пример метода генерации нового группового ключа (можно использовать более надёжный алгоритм)
        private string GenerateNewGroupKey()
        {
            return Guid.NewGuid().ToString("N");
        }

        // Метод для получения публичного ключа пользователя (предполагается, что такая информация хранится в таблице Users)
        private async Task<string> GetUserPublicKeyAsync(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || string.IsNullOrEmpty(user.PublicKey))
            {
                throw new Exception($"Public key not found for user {userId}");
            }
            return user.PublicKey;
        }

        // Метод для шифрования группового ключа с использованием публичного ключа (RSA-OAEP с SHA-256)
        private string EncryptGroupKey(string groupKey, string publicKeyBase64)
        {
            var publicKeyBuffer = Convert.FromBase64String(publicKeyBase64);
            using (var rsa = new System.Security.Cryptography.RSACryptoServiceProvider())
            {
                rsa.ImportSubjectPublicKeyInfo(publicKeyBuffer, out _);
                var groupKeyBytes = System.Text.Encoding.UTF8.GetBytes(groupKey);
                var encryptedBytes = rsa.Encrypt(groupKeyBytes, System.Security.Cryptography.RSAEncryptionPadding.OaepSHA256);
                return Convert.ToBase64String(encryptedBytes);
            }
        }
    }
}
