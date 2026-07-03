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
        return Ok(_db.Mediums.ToList());
    }
}