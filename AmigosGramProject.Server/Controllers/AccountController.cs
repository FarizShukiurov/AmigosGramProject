﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using AmigosGramProject.Server.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace AmigosGramProject.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IEmailSender _emailSender;

        public AccountController(UserManager<User> userManager, IEmailSender emailSender)
        {
            _userManager = userManager;
            _emailSender = emailSender;
        }

        [HttpGet("SearchAccount")]
        public async Task<ActionResult<IEnumerable<UserDto>>> SearchUsers([FromQuery] string nickname)
        {
            if (string.IsNullOrEmpty(nickname))
            {
                return BadRequest("Nickname parameter is required.");
            }
            var users = _userManager.Users
                .Where(u => u.UserName.Contains(nickname))
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email
                })
                .ToList();
            var maxResults = 10;
            var filteredUsers = users.Take(maxResults);

            return Ok(filteredUsers);
        }

        [HttpPost("SendEmailConfirmation")]
        public async Task<IActionResult> SendEmailConfirmation([FromBody] string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var confirmationLink = Url.Action(nameof(ConfirmEmail), "Account", new { userId = user.Id, token = token }, Request.Scheme);

            await _emailSender.SendEmailAsync(email, "Email Confirmation", $"Please confirm your email by clicking this link: <a href='{confirmationLink}'>link</a>");

            return Ok("Confirmation email sent.");
        }

        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
            {
                return Ok("Email confirmed successfully.");
            }

            return BadRequest("Error confirming email.");
        }
    }
}