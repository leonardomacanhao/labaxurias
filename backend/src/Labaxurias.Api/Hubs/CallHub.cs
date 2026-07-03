using Microsoft.AspNetCore.SignalR;

namespace Labaxurias.Api.Hubs;

public class CallHub : Hub
{
    public async Task SendCall(object callData)
    {
        await Clients.All.SendAsync("ReceiveCall", callData);
    }
}