using Labaxurias.Api.Hubs;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Labaxurias.Api.Modules.Attendance.Controllers;

[ApiController]
[Route("api/attendance/call")]
public class CallController : ControllerBase
{
    private readonly LabaxuriasDbContext _db;
    private readonly IHubContext<CallHub> _hub;

    public CallController(
        LabaxuriasDbContext db,
        IHubContext<CallHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpPost("{guideId}")]
    public async Task<IActionResult> CallNext(Guid guideId)
    {
        var next = _db.QueueItems
            .Where(q => q.SpiritualGuideId == guideId && !q.IsCalled)
            .OrderBy(q => q.CreatedAt)
            .FirstOrDefault();

        if (next == null)
        {
            return NotFound(new { message = "Nenhum cliente na fila" });
        }

        next.IsCalled = true;
        next.CalledAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var payload = new
        {
            clientName = next.ClientName,
            guideId = next.SpiritualGuideId,
            calledAt = next.CalledAt
        };

        await _hub.Clients.All.SendAsync("ReceiveCall", payload);

        return Ok(payload);
    }
}