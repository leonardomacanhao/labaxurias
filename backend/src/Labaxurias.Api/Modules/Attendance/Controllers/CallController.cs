using Labaxurias.Api.Hubs;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

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

    [HttpPost("test")]
    public async Task<IActionResult> TestCall()
    {
        var payload = new
        {
            clientName = "Teste do Painel",
            queueItemId = Guid.NewGuid(),
            guideId = Guid.NewGuid(),
            guideName = "Entidade de Teste",
            calledAt = DateTime.UtcNow,
            isTest = true
        };

        await _hub.Clients.All.SendAsync("ReceiveCall", payload);

        return Ok(payload);
    }

    [HttpPost("session-entity/{sessionEntityId}")]
    public async Task<IActionResult> CallNextBySessionEntity(Guid sessionEntityId)
    {
        var sessionEntity = await _db.SessionEntities
            .Include(se => se.SpiritualGuide)
            .Include(se => se.QueueItems)
            .FirstOrDefaultAsync(se => se.Id == sessionEntityId);

        if (sessionEntity == null)
        {
            return NotFound(new { message = "Entidade nao encontrada" });
        }

        var next = sessionEntity.QueueItems
            .Where(q => !q.IsCalled)
            .OrderBy(q => q.Order)
            .FirstOrDefault();

        if (next == null)
        {
            return NotFound(new { message = "Nenhum consulente na fila" });
        }

        next.IsCalled = true;
        next.CalledAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var payload = new
        {
            clientName = next.ClientName,
            queueItemId = next.Id,
            sessionEntityId = sessionEntity.Id,
            guideId = sessionEntity.SpiritualGuideId,
            guideName = sessionEntity.SpiritualGuide?.Name,
            calledAt = next.CalledAt
        };

        await _hub.Clients.All.SendAsync("ReceiveCall", payload);

        return Ok(payload);
    }

    [HttpPost("queue-item/{queueItemId}")]
    public async Task<IActionResult> RepeatCall(Guid queueItemId)
    {
        var queueItem = await _db.QueueItems
            .Include(qi => qi.SessionEntity)
                .ThenInclude(se => se.SpiritualGuide)
            .FirstOrDefaultAsync(qi => qi.Id == queueItemId);

        if (queueItem == null)
        {
            return NotFound(new { message = "Consulente nao encontrado" });
        }

        if (!queueItem.IsCalled)
        {
            queueItem.IsCalled = true;
            queueItem.CalledAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        var payload = new
        {
            clientName = queueItem.ClientName,
            queueItemId = queueItem.Id,
            sessionEntityId = queueItem.SessionEntityId,
            guideId = queueItem.SessionEntity?.SpiritualGuideId,
            guideName = queueItem.SessionEntity?.SpiritualGuide?.Name,
            calledAt = queueItem.CalledAt ?? DateTime.UtcNow
        };

        await _hub.Clients.All.SendAsync("ReceiveCall", payload);

        return Ok(payload);
    }

    [HttpPost("{guideId}")]
    public async Task<IActionResult> CallNext(Guid guideId)
    {
        var next = await _db.QueueItems
            .Include(q => q.SpiritualGuide)
            .Where(q => q.SpiritualGuideId == guideId && !q.IsCalled)
            .OrderBy(q => q.CreatedAt)
            .FirstOrDefaultAsync();

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
            guideName = next.SpiritualGuide?.Name,
            calledAt = next.CalledAt
        };

        await _hub.Clients.All.SendAsync("ReceiveCall", payload);

        return Ok(payload);
    }
}
