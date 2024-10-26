using AmigosGramProject.Server.Models;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly HttpClient _httpClient;

        public ProfileController(UserManager<User> userManager, BlobServiceClient blobServiceClient, HttpClient httpClient)
        {
            _userManager = userManager;
            _blobServiceClient = blobServiceClient;
            _httpClient = httpClient;
        }

        // Upload avatar
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Invalid file.");

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var containerName = "avatars";
            var fileName = $"{user.Id}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            await containerClient.CreateIfNotExistsAsync();

            var blobClient = containerClient.GetBlobClient(fileName);
            using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream);
            }

            user.AvatarUrl = blobClient.Uri.ToString();
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return StatusCode(500, "Failed to update user profile.");

            return Ok(new { avatarUrl = user.AvatarUrl });
        }

        // Get user data
        [HttpGet("get-user-data")]
        public async Task<IActionResult> GetUserData()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            return Ok(new
            {
                avatarUrl = user.AvatarUrl,
                username = user.UserName,
                biography = user.Bio,
                email = user.Email
            });
        }


        // Change username
        [HttpPost("change-username")]
        public async Task<IActionResult> ChangeUsername([FromBody] ChangeUsernameRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return NotFound("User not found");

            // Check if the username already exists
            var existingUser = await _userManager.FindByNameAsync(request.NewUsername);
            if (existingUser != null)
            {
                return Conflict("Username already exists");
            }

            user.UserName = request.NewUsername;
            user.NormalizedUserName = request.NewUsername.ToUpper();

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "Username updated successfully!" });
            }

            return BadRequest(result.Errors);
        }

        // Change biography
        [HttpPost("change-biography")]
        public async Task<IActionResult> ChangeBiography([FromBody] ChangeBiographyRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            user.Bio = request.Biography;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
                return Ok(new { message = "Biography updated successfully!" });

            return BadRequest(result.Errors);
        }
    }
    // Request classes for changing username and biography

    public class ChangeBiographyRequest
    {
        public string Biography { get; set; }
    }

    public class ChangeUsernameRequest
    {
        public string NewUsername { get; set; }
    }
}