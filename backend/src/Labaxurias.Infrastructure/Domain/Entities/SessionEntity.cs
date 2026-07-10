namespace Labaxurias.Infrastructure.Domain.Entities;

public class SessionEntity
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid SpiritualGuideId { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Session Session { get; set; } = null!;
    public SpiritualGuide SpiritualGuide { get; set; } = null!;
    public ICollection<QueueItem> QueueItems { get; set; } = new List<QueueItem>();
}
