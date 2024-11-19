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

            var contactIds = user.Contacts.Select(c => c.ContactId).ToList();
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

        // Добавление контакта
        [HttpPost("AddContact")]
        public async Task<ActionResult> AddContact([FromBody] string contactEmail)
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized();

            var contact = await _context.Users.FirstOrDefaultAsync(u => u.Email == contactEmail);
            if (contact == null)
                return NotFound("Contact not found.");

            if (contact.Id == user.Id)
                return Conflict("You cannot add yourself as a contact.");

            var existingContact = user.Contacts.FirstOrDefault(c => c.ContactId == contact.Id);
            if (existingContact != null)
                return Conflict("This contact is already added.");

            var userContact = new UserContact
            {
                UserId = user.Id,
                ContactId = contact.Id
            };

            user.Contacts.Add(userContact);
            await _context.SaveChangesAsync();

            return Ok();
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
    }

    // Класс запроса для удаления контакта
    public class DeleteContactRequest
    {
        public string ContactId { get; set; }
    }
}
