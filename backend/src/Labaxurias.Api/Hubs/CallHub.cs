using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Labaxurias.Api.Hubs;

public class CallHub : Hub
{
    private static readonly ConcurrentDictionary<string, DateTime> PublicPanels = new();
    private static readonly TimeSpan PublicPanelTtl = TimeSpan.FromSeconds(20);

    public static int PublicPanelCount
    {
        get
        {
            PruneStalePublicPanels();
            return PublicPanels.Count;
        }
    }

    public async Task RegisterPublicPanel()
    {
        PublicPanels[Context.ConnectionId] = DateTime.UtcNow;
        await BroadcastPublicPanelStatus();
    }

    public Task RequestPublicPanelStatus()
    {
        PruneStalePublicPanels();
        return Clients.Caller.SendAsync("PublicPanelStatus", new
        {
            connected = PublicPanelCount > 0,
            count = PublicPanelCount
        });
    }

    public async Task SendCall(object callData)
    {
        await Clients.All.SendAsync("ReceiveCall", callData);
    }

    public async Task ClearPublicHistory()
    {
        await Clients.All.SendAsync("ClearPublicHistory");
    }

    public override async Task OnConnectedAsync()
    {
        var role = Context.GetHttpContext()?.Request.Query["role"].ToString();
        if (string.Equals(role, "public", StringComparison.OrdinalIgnoreCase))
        {
            PublicPanels[Context.ConnectionId] = DateTime.UtcNow;
            await BroadcastPublicPanelStatus();
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        PublicPanels.TryRemove(Context.ConnectionId, out _);
        await BroadcastPublicPanelStatus();
        await base.OnDisconnectedAsync(exception);
    }

    private Task BroadcastPublicPanelStatus()
    {
        PruneStalePublicPanels();
        return Clients.All.SendAsync("PublicPanelStatus", new
        {
            connected = PublicPanelCount > 0,
            count = PublicPanelCount
        });
    }

    private static void PruneStalePublicPanels()
    {
        var cutoff = DateTime.UtcNow - PublicPanelTtl;
        foreach (var panel in PublicPanels)
        {
            if (panel.Value < cutoff)
            {
                PublicPanels.TryRemove(panel.Key, out _);
            }
        }
    }
}
