﻿using AmigosGramProject.Server.DTOs;
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

        [HttpPost("AddParticipants")]
        public async Task<IActionResult> AddParticipants([FromBody] AddParticipantsRequest request)
        {
            var group = await _context.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == request.GroupId);
            if (group == null)
            {
                return NotFound("Group not found.");
            }

            foreach (var participant in request.Participants)
            {
                if (!group.Members.Any(p => p.UserId == participant.UserId))
                {
                    group.Members.Add(new GroupMember
                    {
                        GroupId = request.GroupId,
                        UserId = participant.UserId,
                        EncryptedGroupKey = participant.EncryptedGroupKey
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Participants added successfully.");
        }


    }
}
