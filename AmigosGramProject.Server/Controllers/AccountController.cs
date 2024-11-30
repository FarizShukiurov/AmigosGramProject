using Microsoft.AspNetCore.Mvc;
using AmigosGramProject.Server.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AmigosGramProject.Server.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using static System.Net.WebRequestMethods;

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
        private readonly IWebHostEnvironment _webHostEnvironment;

        public AccountController(
            ChatDbContext context,
            JwtTokenHelper jwtTokenHelper,
            Services.PasswordHasher passwordHasher,
            IEmailSender emailSender,
            IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _jwtTokenHelper = jwtTokenHelper;
            _passwordHasher = passwordHasher;
            _emailSender = emailSender;
            _webHostEnvironment = webHostEnvironment;
        }

        // Регистрация пользователя
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO model)
        {
            if (await _context.Users.AnyAsync(u => u.UserName == model.UserName || u.Email == model.Email))
            {
                return BadRequest("Username or email already exists.");
            }

            // Список доступных аватарок
            var avatarUrls = new List<string>
            {
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosBlack.png",
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosBrown.png",
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosDarkBlue.png",
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosDarkRed.png",
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosGreen.png",
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosOrange.png",
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosPurple.png",
                    "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosRed.png"
                };

            // Выбор случайной аватарки
            var random = new Random();
            var randomAvatarUrl = avatarUrls[random.Next(avatarUrls.Count)];

            // Создание нового пользователя
            var user = new User
            {
                UserName = model.UserName,
                Email = model.Email,
                PasswordHash = _passwordHasher.Generate(model.Password),
                AvatarUrl = randomAvatarUrl // Установка случайного URL аватарки
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var accessToken = _jwtTokenHelper.GenerateAccessToken(user);
            var refreshToken = _jwtTokenHelper.GenerateRefreshToken();

            // Установка refresh токена в cookie
            HttpContext.Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            // Отправка email с подтверждением
            var confirmationLink = Url.Action(nameof(ConfirmEmail), "Account", new { userId = user.Id }, Request.Scheme);
            await _emailSender.SendEmailAsync(model.Email, "Email Confirmation", $"Please confirm your email by clicking this link: <a href='{confirmationLink}'>link</a>");

            return Ok(new { userId = user.Id, accessToken, avatarUrl = user.AvatarUrl });
        }


        // Логин пользователя
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == model.UserName);

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

        [HttpPost("SendResetPasswordLink")]
        public async Task<IActionResult> SendResetPasswordLink([FromBody] DTOs.ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is null or empty.");
            }

            Console.WriteLine($"Received email: {request.Email}");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            var resetToken = _jwtTokenHelper.GenerateResetPasswordToken(user);
            var resetLink = Url.Action(nameof(ResetPasswordForm), "Account", new { token = resetToken }, Request.Scheme);

            await _emailSender.SendEmailAsync(request.Email, "Password Reset",
                $"Click the link to reset your password: <a href='{resetLink}'>Reset Password</a>");

            return Ok("Password reset link sent to your email.");
        }



        // Adjusted to return an HTML form for password reset
        [HttpGet("ResetPasswordForm")]
        public IActionResult ResetPasswordForm(string token)
        {
            var claimsPrincipal = _jwtTokenHelper.ValidateResetPasswordToken(token);
            if (claimsPrincipal == null)
            {
                return BadRequest("Invalid or expired token.");
            }

            // Return a simple HTML form for password reset with a black-and-white style.
            var htmlForm = @"
    <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    color: #000;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .form-container {
                    background-color: #fff;
                    border: 1px solid #000;
                    border-radius: 8px;
                    padding: 20px;
                    width: 300px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h2 {
                    text-align: center;
                    font-size: 18px;
                    margin-bottom: 20px;
                }
                label {
                    font-size: 14px;
                    margin-bottom: 5px;
                    display: block;
                }
                input {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 15px;
                    border: 1px solid #000;
                    border-radius: 4px;
                    font-size: 14px;
                    color: #000;
                    background-color: #fff;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    font-size: 14px;
                    color: #fff;
                    background-color: #000;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #333;
                }
                .error-message {
                    color: red;
                    font-size: 12px;
                    margin-top: -10px;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class='form-container'>
                <h2>Reset Your Password</h2>
                <form id='resetPasswordForm'>
                    <input type='hidden' name='token' value='" + token + @"' />
                    
                    <label for='oldPassword'>Old Password</label>
                    <input type='password' id='oldPassword' name='oldPassword' required />
                    
                    <label for='newPassword'>New Password</label>
                    <input type='password' id='newPassword' name='newPassword' required />
                    
                    <label for='confirmNewPassword'>Confirm New Password</label>
                    <input type='password' id='confirmNewPassword' name='confirmNewPassword' required />
                    
                    <button type='button' id='resetPasswordBtn'>Reset Password</button>
                </form>
                <div class='error-message' id='errorMessage'></div>
            </div>

            <script>
                document.getElementById('resetPasswordBtn').addEventListener('click', function() {
                    var formData = new FormData(document.getElementById('resetPasswordForm'));

                    var data = {};
                    formData.forEach((value, key) => { data[key] = value });

                    fetch('/Account/ResetPassword', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Failed to reset password');
                        }
                    })
                    .then(data => {
                        alert('Password successfully reset!');
                        console.log('Success:', data);
                    })
                    .catch((error) => {
                        document.getElementById('errorMessage').innerText = 'Error: ' + error.message;
                        console.error('Error:', error);
                    });
                });
            </script>
        </body>
    </html>";

            return Content(htmlForm, "text/html");
        }



        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO model)
        {
            if (model == null)
            {
                return BadRequest("Invalid data.");
            }

            var claimsPrincipal = _jwtTokenHelper.ValidateResetPasswordToken(model.Token);
            if (claimsPrincipal == null)
            {
                return BadRequest("Invalid or expired token.");
            }

            var userId = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return BadRequest("Invalid token: user ID not found.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            // Проверка старого пароля
            if (!_passwordHasher.Verify(model.OldPassword, user.PasswordHash))
            {
                return BadRequest("Old password is incorrect.");
            }

            // Проверка совпадения нового пароля и подтверждения нового пароля
            if (model.NewPassword != model.ConfirmNewPassword)
            {
                return BadRequest("New password and confirmation do not match.");
            }

            // Изменение пароля
            user.PasswordHash = _passwordHasher.Generate(model.NewPassword);
            await _context.SaveChangesAsync();

            // Удаление токенов для пользователя (в данном случае токен доступа)
            HttpContext.Response.Cookies.Delete("accessToken");
            HttpContext.Response.Cookies.Delete("refreshToken");

            // Отправляем сообщение, что пользователь должен войти заново
            return Ok(new { message = "Password reset successfully. Please log in again." });
        }


        // Обновление refreshToken
        [HttpPost("RefreshToken")]
        public IActionResult RefreshToken()
        {
            // Проверка наличия refresh токена в cookie
            if (!HttpContext.Request.Cookies.TryGetValue("refreshToken", out var oldRefreshToken))
            {
                return Unauthorized("Refresh token is missing.");
            }

            // Генерация нового access токена и refresh токена
            var user = GetUserFromToken(oldRefreshToken);
            if (user == null)
            {
                return Unauthorized("Invalid refresh token.");
            }

            var newAccessToken = _jwtTokenHelper.GenerateAccessToken(user);
            var newRefreshToken = _jwtTokenHelper.GenerateRefreshToken();

            HttpContext.Response.Cookies.Append("refreshToken", newRefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new { accessToken = newAccessToken });
        }

        private User GetUserFromToken(string token)
        {
            var claimsPrincipal = _jwtTokenHelper.ValidateToken(token);
            var userId = claimsPrincipal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null)
            {
                throw new Exception("Invalid token: user ID not found.");
            }

            return _context.Users.FirstOrDefault(u => u.Id.ToString() == userId);
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