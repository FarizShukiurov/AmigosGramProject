using AmigosGramProject.Server.DTOs;
using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AmigosGramProject.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ContactsController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ChatDbContext _context;

        public ContactsController(UserManager<User> userManager, ChatDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("GetContacts")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetContacts()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.Users
                .Include(u => u.Contacts) 
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return Unauthorized();
            }

            var contacts = user.Contacts.ToList();

            if (contacts == null || !contacts.Any())
            {
                return Ok(new List<UserDTO>());
            }

            var contactIds = contacts.Select(c => c.ContactId).ToList();
            var users = await _context.Users
                .Where(u => contactIds.Contains(u.Id) && u.Id != userId)
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("AddContact")]
        public async Task<ActionResult> AddContact([FromBody] string contactEmail)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            var contact = await _userManager.FindByEmailAsync(contactEmail);
            if (contact == null)
            {
                return NotFound("Contact not found.");
            }

            if (contact.Id == user.Id)
            {
                return Conflict("You cannot add yourself as a contact.");
            }

            var existingContact = user.Contacts.FirstOrDefault(c => c.ContactId == contact.Id);
            if (existingContact != null)
            {
                return Conflict("This contact is already added.");
            }

            var userContact = new UserContact
            {
                UserId = user.Id,
                ContactId = contact.Id
            };
            user.Contacts.Add(userContact);
            await _context.SaveChangesAsync();

            return Ok();
        }

        public class DeleteContactRequest
        {
            public string ContactId { get; set; }
        }

        [HttpDelete("DeleteContact")]
        public async Task<IActionResult> DeleteContact([FromBody] DeleteContactRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ContactId))
            {
                return BadRequest("ContactId must be provided.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _userManager.Users
                .Include(u => u.Contacts)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var contact = user.Contacts.FirstOrDefault(c => c.ContactId == request.ContactId);
            if (contact == null)
            {
                return NotFound("Contact not found.");
            }

            user.Contacts.Remove(contact);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
