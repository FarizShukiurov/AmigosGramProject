﻿using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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

            var group = new Group
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                AdminId = dto.AdminId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Groups.Add(group);

            // Добавление участников
            foreach (var participant in dto.Participants)
            {
                var member = new GroupMember
                {
                    Id = Guid.NewGuid(),
                    GroupId = group.Id,
                    UserId = participant.UserId,
                    EncryptedGroupKey = participant.EncryptedGroupKey, 
                    JoinedAt = DateTime.UtcNow
                };
                _context.GroupMembers.Add(member);
            }

            await _context.SaveChangesAsync();
            return Ok(new { groupId = group.Id });
        }


        [HttpGet("user/{userId}/groups")]
        public async Task<IActionResult> GetUserGroups(string userId)
        {
            // Находим группы, где пользователь является участником
            var userGroups = await _context.GroupMembers
                .Where(member => member.UserId == userId)
                .Select(member => new
                {
                    GroupId = member.GroupId,
                    GroupName = member.Group.Name,
                    Description = member.Group.Description,
                    AdminId = member.Group.AdminId,
                    CreatedDate = member.Group.CreatedDate,
                    ParticipantsCount = _context.GroupMembers.Count(m => m.GroupId == member.GroupId) // Количество участников
                })
                .Distinct()
                .ToListAsync();

            if (!userGroups.Any())
            {
                return NotFound("No groups found for this user.");
            }

            return Ok(userGroups);
        }

    }
}