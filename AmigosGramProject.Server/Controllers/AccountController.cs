using Microsoft.AspNetCore.Mvc;
using AmigosGramProject.Server.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AmigosGramProject.Server.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace AmigosGramProject.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly ChatDbContext _context;
        private readonly JwtTokenHelper _jwtTokenHelper;
        private readonly Services.PasswordHasher _passwordHasher;
        private readonly IEmailSender _emailSender;

        public AccountController(
            ChatDbContext context,
            JwtTokenHelper jwtTokenHelper,
            Services.PasswordHasher passwordHasher,
            IEmailSender emailSender)
        {
            _context = context;
            _jwtTokenHelper = jwtTokenHelper;
            _passwordHasher = passwordHasher;
            _emailSender = emailSender;
        }

        // Регистрирует пользователя
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO model)
        {
            if (await _context.Users.AnyAsync(u => u.UserName == model.UserName || u.Email == model.Email))
            {
                return BadRequest("Username or email already exists.");
            }

            var user = new User
            {
                UserName = model.UserName,
                Email = model.Email,
                PasswordHash = _passwordHasher.Generate(model.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var accessToken = _jwtTokenHelper.GenerateAccessToken(user);
            var refreshToken = _jwtTokenHelper.GenerateRefreshToken();
            user.RefreshTokens.Add(new RefreshToken { Token = refreshToken, Expires = DateTime.UtcNow.AddDays(7) });

            await _context.SaveChangesAsync();

            // Отправка email с ссылкой для подтверждения
            var confirmationLink = Url.Action(nameof(ConfirmEmail), "Account", new { userId = user.Id }, Request.Scheme);
            await _emailSender.SendEmailAsync(model.Email, "Email Confirmation", $"Please confirm your email by clicking this link: <a href='{confirmationLink}'>link</a>");

            return Ok(new {userId = user.Id, accessToken, refreshToken });
        }

        // Логин пользователя
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO model)
        {
            var user = await _context.Users.Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.UserName == model.UserName);

            if (user == null || !_passwordHasher.Verify(model.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid credentials.");
            }

            if (!user.EmailConfirmed)
            {
                return BadRequest(new { message = "Email is not confirmed.", action = "ResendConfirmation" });
            }

            var accessToken = _jwtTokenHelper.GenerateAccessToken(user);
            var refreshToken = _jwtTokenHelper.GenerateRefreshToken();

            user.RefreshTokens.Add(new RefreshToken { Token = refreshToken, Expires = DateTime.UtcNow.AddDays(7) });
            await _context.SaveChangesAsync();

            HttpContext.Response.Cookies.Append("accessToken", accessToken, new CookieOptions
            {
                Secure = true,
                Expires = DateTimeOffset.UtcNow.AddHours(1)
            });

            HttpContext.Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new { message = "Login successful" });
        }

        // Обновление refreshToken
        [HttpPost("RefreshToken")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDTO model)
        {
            var user = await _context.Users.Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == model.RefreshToken && !t.IsExpired));

            if (user == null)
            {
                return Unauthorized("Invalid refresh token.");
            }

            var newAccessToken = _jwtTokenHelper.GenerateAccessToken(user);
            var newRefreshToken = _jwtTokenHelper.GenerateRefreshToken();

            // Отмена старого refresh token
            var oldToken = user.RefreshTokens.First(t => t.Token == model.RefreshToken);
            oldToken.IsRevoked = true;

            // Добавление нового refresh token
            user.RefreshTokens.Add(new RefreshToken { Token = newRefreshToken, Expires = DateTime.UtcNow.AddDays(7) });
            await _context.SaveChangesAsync();

            return Ok(new { accessToken = newAccessToken, refreshToken = newRefreshToken });
        }

        // Поиск пользователей по nickname
        [HttpGet("SearchAccount")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> SearchUsers([FromQuery] string nickname)
        {
            if (string.IsNullOrEmpty(nickname))
            {
                return BadRequest("Nickname parameter is required.");
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var users = await _context.Users
                .Where(u => u.UserName.Contains(nickname) && u.Id != currentUserId)
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    AvatarUrl = u.AvatarUrl
                })
                .ToListAsync();

            var maxResults = 10;
            var filteredUsers = users.Take(maxResults);

            return Ok(filteredUsers);
        }

        // Отправка email для подтверждения
        [HttpPost("SendEmailConfirmation")]
        public async Task<IActionResult> SendEmailConfirmation([FromBody] string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            var confirmationLink = Url.Action(nameof(ConfirmEmail), "Account", new { userId = user.Id }, Request.Scheme);
            await _emailSender.SendEmailAsync(email, "Email Confirmation", $"Please confirm your email by clicking this link: <a href='{confirmationLink}'>link</a>");

            return Ok("Confirmation email sent.");
        }

        // Подтверждение email
        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            if (user.EmailConfirmed)
            {
                return BadRequest("Email is already confirmed.");
            }

            user.EmailConfirmed = true;
            await _context.SaveChangesAsync();

            return Ok("Email confirmed successfully.");
        }

        [HttpPost("ResendEmailConfirmation")]
        public async Task<IActionResult> ResendEmailConfirmation([FromBody] string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            if (user.EmailConfirmed)
            {
                return BadRequest("Email is already confirmed.");
            }

            // Генерация новой ссылки подтверждения
            var confirmationLink = Url.Action(nameof(ConfirmEmail), "Account", new { userId = user.Id }, Request.Scheme);
            await _emailSender.SendEmailAsync(user.Email, "Email Confirmation",
                $"Please confirm your email by clicking this link: <a href='{confirmationLink}'>link</a>");

            return Ok("Confirmation email resent.");
        }


        // Получение ID текущего пользователя
        [HttpGet("GetCurrentUserId")]
        public IActionResult GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                return Ok(userId);
            }
            return Unauthorized();
        }
        [HttpGet("pingauth")]
        [Authorize]
        public IActionResult PingAuth()
        {
            var usernameClaim = User.FindFirstValue(ClaimTypes.Name);  // Используем ClaimTypes.Name для username
            if (usernameClaim != null)
            {
                return Ok(new { Username = usernameClaim });
            }
            return Unauthorized();
        }


        // Логаут (удаление токена на клиенте)
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { Message = "Logged out successfully. Please remove your token on the client side." });
        }
    }
}
