using Labaxurias.Infrastructure.Domain.Entities;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace Labaxurias.Api.Modules.Catalog.Controllers;

[ApiController]
[Route("api/catalog/mediums")]
public class MediumController : ControllerBase
{
    private readonly LabaxuriasDbContext _db;

    public MediumController(LabaxuriasDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Medium request)
    {
        _db.Mediums.Add(request);
        await _db.SaveChangesAsync();

        return Ok(request);
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_db.Mediums.OrderBy(m => m.Name).ToList());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest("ID inválido");
        
        var medium = _db.Mediums.Find(guid);
        if (medium == null) return NotFound();
        return Ok(medium);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Medium request)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest("ID inválido");
        
        var medium = _db.Mediums.Find(guid);
        if (medium == null) return NotFound();

        medium.Name = request.Name;
        await _db.SaveChangesAsync();

        return Ok(medium);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest("ID inválido");
        
        var medium = _db.Mediums.Find(guid);
        if (medium == null) return NotFound();

        var guides = _db.SpiritualGuides.Where(g => g.MediumId == guid).ToList();
        _db.SpiritualGuides.RemoveRange(guides);
        
        _db.Mediums.Remove(medium);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
