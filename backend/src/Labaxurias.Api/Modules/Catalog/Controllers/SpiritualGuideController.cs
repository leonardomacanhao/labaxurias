using Labaxurias.Infrastructure.Domain.Entities;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace Labaxurias.Api.Modules.Catalog.Controllers;

[ApiController]
[Route("api/catalog/guides")]
public class SpiritualGuideController : ControllerBase
{
    private readonly LabaxuriasDbContext _db;

    public SpiritualGuideController(LabaxuriasDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SpiritualGuide request)
    {
        _db.SpiritualGuides.Add(request);
        await _db.SaveChangesAsync();

        return Ok(request);
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_db.SpiritualGuides.ToList());
    }
}