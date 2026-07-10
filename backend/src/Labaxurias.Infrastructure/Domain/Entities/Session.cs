namespace Labaxurias.Infrastructure.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<SessionEntity> SessionEntities { get; set; } = new List<SessionEntity>();
}
