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
        return Ok(_db.SpiritualGuides.OrderBy(g => g.Name).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest("ID inválido");
        
        var guide = _db.SpiritualGuides.Find(guid);
        if (guide == null) return NotFound();
        return Ok(guide);
    }

    [HttpGet("medium/{mediumId}")]
    public IActionResult GetByMediumId(string mediumId)
    {
        if (!Guid.TryParse(mediumId, out var mediumGuid)) return BadRequest("ID inválido");
        
        var guides = _db.SpiritualGuides
            .Where(g => g.MediumId == mediumGuid)
            .OrderBy(g => g.Name)
            .ToList();
        return Ok(guides);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] SpiritualGuide request)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest("ID inválido");
        
        var guide = _db.SpiritualGuides.Find(guid);
        if (guide == null) return NotFound();

        guide.Name = request.Name;
        guide.MediumId = request.MediumId;
        await _db.SaveChangesAsync();

        return Ok(guide);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest("ID inválido");
        
        var guide = _db.SpiritualGuides.Find(guid);
        if (guide == null) return NotFound();

        _db.SpiritualGuides.Remove(guide);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
