using Microsoft.AspNetCore.SignalR;

namespace AmigosGramProject.Server.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessageToUserAsync(string message, string userId)
        {
            await this.Clients.User(userId).SendAsync("ReceiveMessage", message);
        }
    }
}
