using Labaxurias.Infrastructure.Domain.Entities;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        // FILTRO SOFT DELETE: Retorna apenas ativos
        return Ok(_db.SpiritualGuides.Where(g => g.IsActive).OrderBy(g => g.Name).ToList());
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
        
        // FILTRO SOFT DELETE: Retorna apenas ativos do médium
        var guides = _db.SpiritualGuides
            .Where(g => g.MediumId == mediumGuid && g.IsActive)
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

        // SOFT DELETE: Apenas desativa, não remove do banco
        guide.IsActive = false;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
