using AmigosGramProject.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AmigosGramProject.Server.DTOs;

namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KeysController : ControllerBase
    {
        private readonly ChatDbContext _context;

        public KeysController(ChatDbContext context)
        {
            _context = context;
        }

        [HttpPost("storePublicKey")]
        public async Task<IActionResult> StorePublicKey([FromBody] KeyDTO keyDto)
        {
            var user = await _context.Users.FindAsync(keyDto.UserId);
            if (user == null) return NotFound();

            user.PublicKey = keyDto.PublicKey;
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("getPublicKey/{userId}")]
        public async Task<IActionResult> GetPublicKey(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.PublicKey == null) return NotFound();

            return Ok(user.PublicKey);
        }

    }
}
