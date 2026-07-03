using Labaxurias.Infrastructure.Domain.Entities;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace Labaxurias.Api.Modules.Attendance.Controllers;

[ApiController]
[Route("api/attendance/queue")]
public class QueueController : ControllerBase
{
    private readonly LabaxuriasDbContext _db;

    public QueueController(LabaxuriasDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] QueueItem request)
    {
        _db.QueueItems.Add(request);
        await _db.SaveChangesAsync();

        return Ok(request);
    }

    [HttpGet("guide/{guideId}")]
    public IActionResult GetByGuide(Guid guideId)
    {
        var queue = _db.QueueItems
            .Where(q => q.SpiritualGuideId == guideId && !q.IsCalled)
            .OrderBy(q => q.CreatedAt)
            .ToList();

        return Ok(queue);
    }
}