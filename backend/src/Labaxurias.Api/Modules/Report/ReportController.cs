using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Labaxurias.Api.Modules.Report.Controllers;

[ApiController]
[Route("api/report")]
public class ReportController : ControllerBase
{
    private readonly LabaxuriasDbContext _db;

    public ReportController(LabaxuriasDbContext db)
    {
        _db = db;
    }

    [HttpGet("attendance/{date}")]
    public async Task<IActionResult> GetAttendanceReport(string date)
    {
        if (!DateTime.TryParse(date, out var reportDate))
            return BadRequest("Data inválida");

        var session = await _db.Sessions
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.SpiritualGuide)
                    .ThenInclude(g => g.Medium)
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.QueueItems)
            .FirstOrDefaultAsync(s => s.Date.Date == reportDate.Date);

        if (session == null)
            return Ok(new { date = reportDate, entities = new List<object>() });

        var result = new
        {
            date = session.Date,
            entities = session.SessionEntities
                .OrderBy(se => se.Order)
                .Select(se => new
                {
                    entityName = se.SpiritualGuide.Name,
                    mediumName = se.SpiritualGuide.Medium.Name,
                    totalCalled = se.QueueItems.Count(qi => qi.IsCalled),
                    attendances = se.QueueItems
                        .Where(qi => qi.IsCalled)
                        .OrderBy(qi => qi.CalledAt)
                        .Select(qi => new
                        {
                            clientName = qi.ClientName,
                            calledAt = qi.CalledAt,
                            createdAt = qi.CreatedAt
                        })
                })
        };

        return Ok(result);
    }

    [HttpGet("registration/{date}")]
    public async Task<IActionResult> GetRegistrationReport(string date)
    {
        if (!DateTime.TryParse(date, out var reportDate))
            return BadRequest("Data inválida");

        var session = await _db.Sessions
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.SpiritualGuide)
                    .ThenInclude(g => g.Medium)
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.QueueItems)
            .FirstOrDefaultAsync(s => s.Date.Date == reportDate.Date);

        if (session == null)
            return Ok(new { date = reportDate, entities = new List<object>() });

        var result = new
        {
            date = session.Date,
            entities = session.SessionEntities
                .OrderBy(se => se.Order)
                .Select(se => new
                {
                    entityName = se.SpiritualGuide.Name,
                    mediumName = se.SpiritualGuide.Medium.Name,
                    registrations = se.QueueItems
                        .OrderBy(qi => qi.CreatedAt)
                        .Select(qi => new
                        {
                            clientName = qi.ClientName,
                            createdAt = qi.CreatedAt,
                            isCalled = qi.IsCalled,
                            calledAt = qi.CalledAt
                        })
                })
        };

        return Ok(result);
    }


    [HttpGet("cambones/{date}")]
    public async Task<IActionResult> GetCambonesReport(string date)
    {
        if (!DateTime.TryParse(date, out var reportDate))
            return BadRequest("Data inválida");

        var session = await _db.Sessions
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.SpiritualGuide)
                    .ThenInclude(g => g.Medium)
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.QueueItems)
            .FirstOrDefaultAsync(s => s.Date.Date == reportDate.Date);

        if (session == null)
            return Ok(new { date = reportDate, entities = new List<object>() });

        var result = new
        {
            date = session.Date,
            entities = session.SessionEntities
                .OrderBy(se => se.Order)
                .Select(se => new
                {
                    entityName = se.SpiritualGuide.Name,
                    mediumName = se.SpiritualGuide.Medium.Name,
                    consulentes = se.QueueItems
                        .OrderBy(qi => qi.Order)
                        .Select(qi => qi.ClientName)
                        .ToList()
                })
        };

        return Ok(result);
    }
}