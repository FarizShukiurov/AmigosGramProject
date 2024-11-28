using AmigosGramProject.Server.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace AmigosGramProject.Server.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessageToUserAsync(string message, string userId)
        {
            await this.Clients.User(userId).SendAsync("ReceiveMessage", message);
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
