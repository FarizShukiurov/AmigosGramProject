using AmigosGramProject.Server.Models;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly BlobServiceClient _blobServiceClient;

        public ProfileController(UserManager<User> userManager, BlobServiceClient blobServiceClient)
        {
            _userManager = userManager;
            _blobServiceClient = blobServiceClient;
        }

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
        [HttpGet("get-user-data")]
        public async Task<IActionResult> GetUserData()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            return Ok(new
            {
                avatarUrl = user.AvatarUrl,
                username = user.UserName
            });
        }

        [HttpPost("change-username")]
        public async Task<IActionResult> ChangeUsername([FromBody] ChangeUsernameRequest request)
        {
            // Получаем текущего пользователя
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Проверка, существует ли уже такой ник
            var existingUser = await _userManager.FindByNameAsync(request.NewUsername);
            if (existingUser != null)
            {
                return Conflict("Username already exists");
            }

            // Обновление имени пользователя
            user.UserName = request.NewUsername;
            user.NormalizedUserName = request.NewUsername.ToUpper(); // Обновление нормализованного имени

            // Обновляем данные пользователя в базе
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok(new { message = "Username updated successfully!" });
            }

            // Если произошла ошибка
            return BadRequest(result.Errors);
        }

    }
}
