using AmigosGramProject.Server.Models;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Требуется JWT аутентификация
    public class ProfileController : ControllerBase
    {
        private readonly ChatDbContext _dbContext;
        private readonly BlobServiceClient _blobServiceClient;

        public ProfileController(ChatDbContext dbContext, BlobServiceClient blobServiceClient)
        {
            _dbContext = dbContext;
            _blobServiceClient = blobServiceClient;
        }

        // Метод для получения текущего пользователя из токена
        private User GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null)
                return null;

            return _dbContext.Users.FirstOrDefault(u => u.Id == userIdClaim);
        }

        [HttpGet("get-user-data-by-id")]
        public async Task<IActionResult> GetUserDataById([FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("UserId is required.");
            }

            // Предполагается, что у вас есть сущность User с полями UserName и AvatarUrl.
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Возвращаем необходимые данные (поля можно расширять по необходимости)
            return Ok(new
            {
                userName = user.UserName,
                avatarUrl = user.AvatarUrl
            });
        }

        // Загрузка аватара
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Invalid file.");

            var user = GetCurrentUser();
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
            _dbContext.Update(user);
            await _dbContext.SaveChangesAsync();

            return Ok(new { avatarUrl = user.AvatarUrl });
        }
        [HttpPost("set-avatar-url")]
        public async Task<IActionResult> SetAvatarUrl([FromBody] SetAvatarUrlRequest request)
        {
            if (string.IsNullOrEmpty(request.AvatarUrl))
                return BadRequest("Avatar URL is required.");

            var user = GetCurrentUser();
            if (user == null)
                return Unauthorized();

            user.AvatarUrl = request.AvatarUrl;
            _dbContext.Update(user);
            await _dbContext.SaveChangesAsync();

            return Ok(new { avatarUrl = user.AvatarUrl });
        }

        public class SetAvatarUrlRequest
        {
            public string AvatarUrl { get; set; }
        }


        // Получение данных пользователя
        [HttpGet("get-user-data")]
        public IActionResult GetUserData()
        {
            var user = GetCurrentUser();
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

        // Изменение имени пользователя
        [HttpPost("change-username")]
        public async Task<IActionResult> ChangeUsername([FromBody] ChangeUsernameRequest request)
        {
            var user = GetCurrentUser();
            if (user == null)
                return Unauthorized();

            // Проверка на существование имени пользователя
            var existingUser = _dbContext.Users.FirstOrDefault(u => u.UserName == request.NewUsername);
            if (existingUser != null)
                return Conflict("Username already exists");

            user.UserName = request.NewUsername;
            _dbContext.Update(user);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Username updated successfully!" });
        }

        // Изменение биографии
        [HttpPost("change-biography")]
        public async Task<IActionResult> ChangeBiography([FromBody] ChangeBiographyRequest request)
        {
            var user = GetCurrentUser();
            if (user == null)
                return Unauthorized();

            user.Bio = request.Biography;
            _dbContext.Update(user);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Biography updated successfully!" });
        }
    }

    // Классы запросов
    public class ChangeBiographyRequest
    {
        public string Biography { get; set; }
    }

    public class ChangeUsernameRequest
    {
        public string NewUsername { get; set; }
    }
}
