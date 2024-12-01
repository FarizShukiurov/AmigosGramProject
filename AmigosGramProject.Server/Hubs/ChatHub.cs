using AmigosGramProject.Server.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace AmigosGramProject.Server.Hubs
{
    public class ChatHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier; // Предполагается, что UserIdentifier уникален для каждого пользователя.
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                Console.WriteLine($"User {userId} added to personal group User_{userId}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
                Console.WriteLine($"User {userId} removed from personal group User_{userId}");
            }
            await base.OnDisconnectedAsync(exception);
        }
        public async Task SendMessageToUserAsync(MessageDTO message, string chatId, string receiverId)
        {
            await Clients.Group(chatId).SendAsync("ReceiveMessage", message);

            await Clients.Group($"User_{receiverId}").SendAsync("UpdateLastMessage", chatId, message);
        }
        public async Task JoinGroup(string chatId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
            Console.WriteLine($"Client joined group {chatId}");
        }

        public async Task LeaveGroup(string chatId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
        }
        public async Task UpdateMessage(string chatId, MessageDTO updatedMessage)
        {
            await Clients.Group(chatId).SendAsync("UpdateMessage", updatedMessage);
        }
        public async Task DeleteMessage(string groupId, int messageId)
        {
            await Clients.Group(groupId).SendAsync("MessageDeleted", messageId);
            Console.WriteLine($"Message deleted in group {groupId}");
        }


    }
}
