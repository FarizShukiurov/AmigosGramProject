﻿using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Hubs;
using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AmigosGramProject.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Требуется аутентификация через JWT
    public class ContactsController : ControllerBase
    {
        private readonly ChatDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public ContactsController(IHubContext<ChatHub> hubContext, ChatDbContext context)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // Метод для извлечения текущего пользователя из JWT токена
        private async Task<User> GetCurrentUserAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return null;

            return await _context.Users
                .Include(u => u.Contacts)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        // Получение списка контактов
        [HttpGet("GetContacts")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetContacts()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            // Получаем список контактов, где текущий пользователь — либо отправитель, либо получатель, и статус "Accepted"
            var contacts = await _context.UserContacts
                .Where(c =>
                    (c.UserId == user.Id || c.ContactId == user.Id) &&
                    c.Status == ContactStatus.Accepted)
                .Select(c => c.UserId == user.Id
                    ? c.Contact // Если текущий пользователь — отправитель, берем получателя
                    : c.User)   // Если текущий пользователь — получатель, берем отправителя
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    AvatarUrl = u.AvatarUrl
                })
                .Distinct() // Убираем дубли
                .ToListAsync();

            return Ok(contacts);
        }

        [HttpPost("SendContactRequest")]
        public async Task<ActionResult> SendContactRequest([FromBody] ContactRequestDTO contactRequestDTO)
        {
            if (contactRequestDTO == null)
                return BadRequest("ContactRequestDTO is required");

            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            var contact = await _context.Users.FirstOrDefaultAsync(u => u.Id == contactRequestDTO.ContactId);
            if (contact == null)
                return NotFound("User not found.");

            if (contact.Id == user.Id)
                return Conflict("You cannot send a request to yourself.");

            var existingContact = await _context.UserContacts
                .FirstOrDefaultAsync(c => c.UserId == user.Id && c.ContactId == contact.Id);

            if (existingContact != null)
            {
                if (existingContact.Status == ContactStatus.Blocked)
                    return Conflict("This user has blocked you.");
                if (existingContact.Status == ContactStatus.Pending)
                    return Conflict("Request already sent.");
                if (existingContact.Status == ContactStatus.Accepted)
                    return Conflict("You are already friends.");
                if (existingContact.Status == ContactStatus.Declined)
                {
                    // Update the status to Pending and resend the request
                    existingContact.Status = ContactStatus.Pending;
                    await _context.SaveChangesAsync();
                    return Ok("Request re-sent.");
                }
            }

            // Adding a new request
            var userContact = new UserContact
            {
                UserId = user.Id,
                ContactId = contact.Id,
                Status = ContactStatus.Pending
            };

            _context.UserContacts.Add(userContact);
            await _context.SaveChangesAsync();

            return Ok("Request sent.");
        }

        [HttpPost("UnblockContact")]
        public async Task<ActionResult> UnblockContact([FromBody] UnblockRequestDTO request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            var contact = await _context.UserContacts
                .FirstOrDefaultAsync(c =>
                    (c.UserId == user.Id && c.ContactId == request.ContactId) ||
                    (c.ContactId == user.Id && c.UserId == request.ContactId));
            Console.WriteLine(contact.Status);
            if (contact == null)
                return NotFound("Contact not found.");

            if (contact.Status != ContactStatus.Blocked)
            {
                return Conflict("This contact is not blocked.");
            }

            contact.Status = ContactStatus.Declined; // Или удаляем запись, если нужно полностью убрать блокировку 
            await _context.SaveChangesAsync();

            return Ok("User unblocked.");
        }


                // Ответ на запрос добавления в контакт
        [HttpPost("RespondToContactRequest")]
        public async Task<ActionResult> RespondToContactRequest([FromBody] RespondToRequestDTO request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            var contactRequest = await _context.UserContacts
                .FirstOrDefaultAsync(c => c.ContactId == user.Id && c.UserId == request.ContactId && c.Status == ContactStatus.Pending);

            if (contactRequest == null)
                return NotFound("Request not found.");

            if (request.Action == "Accept")
            {
                contactRequest.Status = ContactStatus.Accepted;
                // Сохраняем изменения
                await _context.SaveChangesAsync();

                // Отправляем объект UserContact через SignalR обоим пользователям
                await _hubContext.Clients.User(contactRequest.ContactId.ToString())
                                 .SendAsync("FetchUserContacts");
                await _hubContext.Clients.User(contactRequest.UserId.ToString())
                                 .SendAsync("FetchUserContacts");

                return Ok("Request accepted and chat created.");
            }
            else if (request.Action == "Decline")
                contactRequest.Status = ContactStatus.Declined;
            else if (request.Action == "Block")
                contactRequest.Status = ContactStatus.Blocked;
            else
                return BadRequest("Invalid action.");

            await _context.SaveChangesAsync();
            return Ok($"Request {request.Action.ToLower()}ed.");
        }

        [HttpGet("GetContactRequests")]
        public async Task<ActionResult> GetContactRequests()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            // Входящие запросы
            var incomingRequests = await _context.UserContacts
                .Where(c => c.ContactId == user.Id && c.Status == ContactStatus.Pending)
                .Select(c => new ContactRequestDTO
                {
                    ContactId = c.UserId,
                    UserName = c.User.UserName,
                    AvatarUrl = c.User.AvatarUrl,
                    Status = c.Status // Добавляем статус
                })
                .ToListAsync();

            // Исходящие запросы
            var outgoingRequests = await _context.UserContacts
                .Where(c => c.UserId == user.Id && c.Status == ContactStatus.Pending)
                .Select(c => new ContactRequestDTO
                {
                    ContactId = c.ContactId,
                    UserName = c.Contact.UserName,
                    AvatarUrl = c.Contact.AvatarUrl,
                    Status = c.Status // Добавляем статус
                })
                .ToListAsync();

            // Заблокированные пользователи
            var blockedUsers = await _context.UserContacts
                .Where(c => (c.ContactId == user.Id) && c.Status == ContactStatus.Blocked)
                .Select(c => new ContactRequestDTO
                {
                    ContactId = c.UserId == user.Id ? c.ContactId : c.UserId, // Определяем, кто был заблокирован
                    UserName = c.UserId == user.Id ? c.Contact.UserName : c.User.UserName, // Имя заблокированного пользователя
                    AvatarUrl = c.UserId == user.Id ? c.Contact.AvatarUrl : c.User.AvatarUrl, // Аватар заблокированного пользователя
                    Status = c.Status// Добавляем статус
                })
                .ToListAsync();

            // Формируем итоговый ответ
            return Ok(new
            {
                Incoming = incomingRequests,
                Outgoing = outgoingRequests,
                Blocked = blockedUsers
            });
        }


        [HttpGet("GetContactDetails/{contactId}")]
        public async Task<ActionResult<UserDTO>> GetContactDetails(string contactId)
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            var contact = await _context.Users
                .Where(u => u.Id == contactId)
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    AvatarUrl = u.AvatarUrl,
                    Bio = u.Bio
                })
                .FirstOrDefaultAsync();

            if (contact == null)
                return NotFound("Contact not found.");

            return Ok(contact);
        }


        // Удаление контакта
        [HttpDelete("DeleteContact")]
        public async Task<IActionResult> DeleteContact([FromBody] DeleteContactRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ContactId))
                return BadRequest("ContactId must be provided.");

            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null)
                return Unauthorized();

            // Поиск контакта, где текущий пользователь участвует
            var contact = await _context.UserContacts.FirstOrDefaultAsync(uc =>
                (uc.UserId == currentUser.Id && uc.ContactId == request.ContactId) ||
                (uc.ContactId == currentUser.Id && uc.UserId == request.ContactId));

            if (contact == null)
                return NotFound("Contact not found.");

            // Удаляем запись контакта
            _context.UserContacts.Remove(contact);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.User(contact.ContactId.ToString())
                                 .SendAsync("FetchUserContacts");
            await _hubContext.Clients.User(contact.UserId.ToString())
                             .SendAsync("FetchUserContacts");
            return NoContent();
        }

        [HttpGet("GetProfile")]
        public async Task<IActionResult> GetProfile(string contactId)
        {
            if (string.IsNullOrWhiteSpace(contactId))
                return BadRequest("ContactId must be provided.");

            var contact = await _context.Users
                .Where(u => u.Id == contactId)
                .Select(u => new
                {
                    u.UserName,
                    u.AvatarUrl,
                    u.Email,
                    u.Bio
                })
                .FirstOrDefaultAsync();

            if (contact == null)
                return NotFound("Contact not found.");

            return Ok(contact);
        }

        [HttpDelete("DeleteContactRequest")]
        public async Task<IActionResult> DeleteContactRequest([FromBody] DeleteContactRequestModel model)
        {
            if (model?.ContactId == null)
            {
                return BadRequest("ContactId is required");
            }

            // Находим запрос в базе данных
            var contactRequest = await _context.UserContacts
                .FirstOrDefaultAsync(c => c.ContactId == model.ContactId && c.Status == ContactStatus.Pending);

            if (contactRequest == null)
            {
                return NotFound("Contact request not found");
            }

            // Удаляем запрос
            _context.UserContacts.Remove(contactRequest);
            await _context.SaveChangesAsync();

            return Ok("Contact request deleted");
        }
    }
    public class DeleteContactRequestModel
    {
        public string ContactId { get; set; }
    }
    // Класс запроса для удаления контакта
    public class DeleteContactRequest
    {
        public string ContactId { get; set; }
    }
}
