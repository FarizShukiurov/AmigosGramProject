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
    public class GroupController : ControllerBase
    {
        private readonly ChatDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        public GroupController(ChatDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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

            foreach (var member in group.Members)
            {
                await _hubContext.Clients.User(member.UserId.ToString())
                    .SendAsync("FetchUserGroups");
            }

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
            if (request == null || request.Participants == null || !request.Participants.Any())
            {
                return BadRequest("Invalid request data.");
            }

            // Находим группу по request.GroupId
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == request.GroupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Обрабатываем каждого участника из запроса: добавляем только если его ещё нет в группе
            foreach (var participant in request.Participants)
            {
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
                    _context.GroupMembers.Add(member);
                }
            }

            await _context.SaveChangesAsync();

            return Ok("Participants added successfully.");
        }

        [HttpDelete("RemoveParticipants")]
        public async Task<IActionResult> RemoveParticipants([FromBody] RemoveParticipantsRequest request)
        {
            if (request == null || request.ParticipantIds == null || !request.ParticipantIds.Any())
            {
                return BadRequest("Invalid request data.");
            }

            // Загружаем группу вместе с участниками
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == request.GroupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Проверяем, что отправитель является администратором группы
            if (group.AdminId != request.SenderId)
            {
                return Forbid();
            }

            // Для каждого участника из списка удаляем его, если он найден
            foreach (var participantId in request.ParticipantIds)
            {
                var memberToRemove = group.Members.FirstOrDefault(m => m.UserId == participantId);
                if (memberToRemove != null)
                {
                    _context.GroupMembers.Remove(memberToRemove);
                }
            }

            // Если передан список обновлённых ключей, обновляем их через контекст
            if (request.UpdatedParticipants != null && request.UpdatedParticipants.Any())
            {
                foreach (var participantDto in request.UpdatedParticipants)
                {
                    var groupMember = await _context.GroupMembers
                        .FirstOrDefaultAsync(m => m.UserId == participantDto.UserId && m.GroupId == request.GroupId);
                    if (groupMember != null)
                    {
                        groupMember.EncryptedGroupKey = participantDto.EncryptedGroupKey;
                        _context.GroupMembers.Update(groupMember);
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Participants removed successfully.");
        }


        [HttpGet("GetGroupKey/{groupId}/{userId}")]
        public async Task<IActionResult> GetGroupKey(Guid groupId, string userId)
        {
            // Находим запись участника в группе по groupId и userId
            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);

            if (member == null)
            {
                return NotFound("Group member not found.");
            }

            // Возвращаем зашифрованный групповой ключ участника
            return Ok(new {member.EncryptedGroupKey });
        }
        [HttpDelete("DeleteGroup/{groupId}")]
        public async Task<IActionResult> DeleteGroup(Guid groupId, [FromQuery] string adminId)
        {
            if (string.IsNullOrEmpty(adminId))
            {
                return BadRequest("Admin ID is required.");
            }

            // Находим группу с участниками
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Проверяем, что запрос исходит от администратора группы
            if (group.AdminId != adminId)
            {
                return Forbid("Only the group admin can delete the group.");
            }

            // Удаляем группу (также будут удалены связанные участники, если настроено каскадное удаление)
            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();

            // Уведомляем участников о удалении группы
            foreach (var member in group.Members)
            {
                await _hubContext.Clients.User(member.UserId.ToString())
                    .SendAsync("FetchUserGroups", groupId);
            }

            return Ok("Group deleted successfully.");
        }

        [HttpGet("GetAdminId/{groupId}")]
        public async Task<IActionResult> GetAdminId(Guid groupId)
        {
            // Ищем группу по переданному идентификатору
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                return NotFound("Group not found.");
            }
            // Возвращаем adminId группы в виде JSON
            return Ok(new { adminId = group.AdminId });
        }

        [HttpPut("updateGroup")]
        public async Task<IActionResult> UpdateGroup([FromBody] UpdateGroupDto updateGroupDto)
        {
            if (updateGroupDto == null)
            {
                return BadRequest("Update data is required.");
            }

            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == updateGroupDto.GroupId);
            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Проверяем, что только администратор может обновлять настройки
            if (group.AdminId != updateGroupDto.AdminId)
            {
                return Forbid("Only group admin can update settings.");
            }

            group.Name = updateGroupDto.Name;
            group.Description = updateGroupDto.Description;
            group.AvatarUrl = updateGroupDto.AvatarUrl;

            _context.Groups.Update(group);
            await _context.SaveChangesAsync();

            return Ok(group);
        }
    }


}

