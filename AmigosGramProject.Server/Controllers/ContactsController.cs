using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


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
        public async Task<ActionResult<IEnumerable<User>>> GetContacts()
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null)
            {
                return Unauthorized();
            }

            var contacts = await _context.Users
                .Where(u => user.Contacts.Select(c => c.ContactId).Contains(u.Id))
                .ToListAsync();

            return Ok(contacts);
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

            var userContact = new UserContact
            {
                UserId = user.Id,
                ContactId = contact.Id
            };

            user.Contacts.Add(userContact);
            await _context.SaveChangesAsync();

            return Ok();
        }
        [HttpDelete("DeleteContact")]
        public async Task<IActionResult> DeleteContact(string contactId)
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null)
            {
                return Unauthorized();
            }

            var contact = user.Contacts.FirstOrDefault(c => c.ContactId == contactId);

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
