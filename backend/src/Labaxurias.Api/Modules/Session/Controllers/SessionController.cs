using Labaxurias.Infrastructure.Domain.Entities;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SessionEntity = Labaxurias.Infrastructure.Domain.Entities.SessionEntity;
using SessionModel = Labaxurias.Infrastructure.Domain.Entities.Session;

namespace Labaxurias.Api.Modules.Session.Controllers;

[ApiController]
[Route("api/session")]
public class SessionController : ControllerBase
{
    private readonly LabaxuriasDbContext _db;

    public SessionController(LabaxuriasDbContext db)
    {
        _db = db;
    }

    [HttpGet("{date}")]
    public async Task<IActionResult> GetSessionByDate(string date)
    {
        if (!DateTime.TryParse(date, out var sessionDate))
            return BadRequest("Data inválida");

        var session = await _db.Sessions
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.SpiritualGuide)
                    .ThenInclude(g => g.Medium)
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.QueueItems)
            .FirstOrDefaultAsync(s => s.Date.Date == sessionDate.Date);

        if (session == null)
            return Ok(new { sessionEntities = new List<object>() });

        var result = new
        {
            sessionId = session.Id,
            date = session.Date,
            sessionEntities = session.SessionEntities
                .OrderBy(se => se.Order)
                .Select(se => new
                {
                    sessionEntityId = se.Id,
                    entityId = se.SpiritualGuideId,
                    entityName = se.SpiritualGuide.Name,
                    mediumId = se.SpiritualGuide.MediumId,
                    mediumName = se.SpiritualGuide.Medium.Name,
                    queueItems = se.QueueItems
                        .OrderBy(qi => qi.Order)
                        .Select(qi => new
                        {
                            id = qi.Id,
                            name = qi.ClientName,
                            order = qi.Order,
                            isCalled = qi.IsCalled,
                            calledAt = qi.CalledAt
                        })
                })
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> SaveSession([FromBody] SaveSessionRequest request)
    {
        if (!DateTime.TryParse(request.Date, out var sessionDate))
            return BadRequest("Data inválida");

        var session = await _db.Sessions
            .Include(s => s.SessionEntities)
                .ThenInclude(se => se.QueueItems)
            .FirstOrDefaultAsync(s => s.Date.Date == sessionDate.Date);

        if (session == null)
        {
            // Criar nova sessão
            session = new SessionModel { Date = sessionDate };
            _db.Sessions.Add(session);
            await _db.SaveChangesAsync();

            int order = 0;
            foreach (var entity in request.Entities)
            {
                var sessionEntity = new SessionEntity
                {
                    SessionId = session.Id,
                    SpiritualGuideId = entity.EntityId,
                    Order = order++,
                    QueueItems = entity.QueueItems.Select((qi, idx) => new QueueItem
                    {
                        ClientName = qi.Name,
                        Order = idx,
                        SpiritualGuideId = entity.EntityId
                    }).ToList()
                };
                _db.SessionEntities.Add(sessionEntity);
            }
        }
        else
        {
            // Merge inteligente: preservar estados isCalled
            var existingEntities = session.SessionEntities.ToDictionary(se => se.SpiritualGuideId);
            var requestEntityIds = request.Entities.Select(e => e.EntityId).ToHashSet();

            // Remover entidades que não estão mais na requisição
            foreach (var existing in session.SessionEntities.ToList())
            {
                if (!requestEntityIds.Contains(existing.SpiritualGuideId))
                {
                    _db.SessionEntities.Remove(existing);
                }
            }

            // Atualizar ou criar entidades
            int order = 0;
            foreach (var entity in request.Entities)
            {
                if (existingEntities.TryGetValue(entity.EntityId, out var existingEntity))
                {
                    // Entidade já existe - fazer merge dos queueItems
                    existingEntity.Order = order++;
                    
                    // Criar dicionário dos queueItems existentes por nome
                    var existingQueueItems = existingEntity.QueueItems.ToDictionary(qi => qi.ClientName);
                    
                    // Remover queueItems que não estão mais na requisição
                    var requestQueueItemNames = entity.QueueItems.Select(qi => qi.Name).ToHashSet();
                    foreach (var existingQI in existingEntity.QueueItems.ToList())
                    {
                        if (!requestQueueItemNames.Contains(existingQI.ClientName))
                        {
                            _db.QueueItems.Remove(existingQI);
                        }
                    }
                    
                    // Atualizar ordem dos queueItems existentes e adicionar novos
                    int qiOrder = 0;
                    foreach (var qiRequest in entity.QueueItems)
                    {
                        if (existingQueueItems.TryGetValue(qiRequest.Name, out var existingQI))
                        {
                            // QueueItem existe - preservar isCalled e calledAt, apenas atualizar ordem
                            existingQI.Order = qiOrder++;
                        }
                        else
                        {
                            // QueueItem novo - criar
                            existingEntity.QueueItems.Add(new QueueItem
                            {
                                ClientName = qiRequest.Name,
                                Order = qiOrder++,
                                SpiritualGuideId = entity.EntityId,
                                IsCalled = false
                            });
                        }
                    }
                }
                else
                {
                    // Entidade nova - criar do zero
                    var sessionEntity = new SessionEntity
                    {
                        SessionId = session.Id,
                        SpiritualGuideId = entity.EntityId,
                        Order = order++,
                        QueueItems = entity.QueueItems.Select((qi, idx) => new QueueItem
                        {
                            ClientName = qi.Name,
                            Order = idx,
                            SpiritualGuideId = entity.EntityId,
                            IsCalled = false
                        }).ToList()
                    };
                    _db.SessionEntities.Add(sessionEntity);
                }
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new { sessionId = session.Id });
    }
}

public class SaveSessionRequest
{
    public string Date { get; set; } = string.Empty;
    public List<SessionEntityRequest> Entities { get; set; } = new();
}

public class SessionEntityRequest
{
    public Guid EntityId { get; set; }
    public List<QueueItemRequest> QueueItems { get; set; } = new();
}

public class QueueItemRequest
{
    public string Name { get; set; } = string.Empty;
}
