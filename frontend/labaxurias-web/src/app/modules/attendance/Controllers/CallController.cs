using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace Labaxurias.Api.Modules.Attendance.Controllers;

[ApiController]
[Route("api/attendance/call")]
public class CallController : ControllerBase
{
    private readonly LabaxuriasDbContext _db;

    public CallController(LabaxuriasDbContext db)
    {
        _db = db;
    }

    [HttpPost("{guideId}")]
    public async Task<IActionResult> CallNext(Guid guideId)
    {
        var next = _db.QueueItems
            .Where(q => q.SpiritualGuideId == guideId && !q.IsCalled)
            .OrderBy(q => q.CreatedAt)
            .FirstOrDefault();

        if (next == null)
            return NotFound(new { message = "Nenhum cliente na fila" });

        next.IsCalled = true;
        next.CalledAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            clientName = next.ClientName,
            guideId = next.SpiritualGuideId,
            calledAt = next.CalledAt
        });
    }
}