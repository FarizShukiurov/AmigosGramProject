using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        public ContactsController(ChatDbContext context)
        {
            _context = context;
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

            // Получаем список контактов, которые имеют статус "Принят"
            var contactIds = user.Contacts
                .Where(c => c.Status == ContactStatus.Accepted)
                .Select(c => c.ContactId)
                .ToList();

            if (!contactIds.Any())
                return Ok(new List<UserDTO>());

            var contacts = await _context.Users
                .Where(u => contactIds.Contains(u.Id) && u.Id != user.Id)
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    AvatarUrl = u.AvatarUrl
                })
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
            }

            // Добавление нового запроса
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

            // Обработка действия
            if (request.Action == "Accept")
                contactRequest.Status = ContactStatus.Accepted;
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
        public async Task<ActionResult<IEnumerable<ContactRequestDTO>>> GetContactRequests()
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
                    AvatarUrl = c.User.AvatarUrl
                })
                .ToListAsync();

            // Исходящие запросы
            var outgoingRequests = await _context.UserContacts
                .Where(c => c.UserId == user.Id && c.Status == ContactStatus.Pending)
                .Select(c => new ContactRequestDTO
                {
                    ContactId = c.ContactId,
                    UserName = c.Contact.UserName,
                    AvatarUrl = c.Contact.AvatarUrl
                })
                .ToListAsync();

            return Ok(new { Incoming = incomingRequests, Outgoing = outgoingRequests });
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

            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            var contact = user.Contacts.FirstOrDefault(c => c.ContactId == request.ContactId);
            if (contact == null)
                return NotFound("Contact not found.");

            user.Contacts.Remove(contact);
            await _context.SaveChangesAsync();

            return NoContent();
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
