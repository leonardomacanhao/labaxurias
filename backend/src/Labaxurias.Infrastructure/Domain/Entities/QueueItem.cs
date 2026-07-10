namespace Labaxurias.Infrastructure.Domain.Entities;

public class QueueItem
{
    public Guid Id { get; set; }
    public Guid? SpiritualGuideId { get; set; }
    public Guid? SessionEntityId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsCalled { get; set; } = false;
    public DateTime? CalledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navegação (ambos opcionais para manter compatibilidade)
    public SpiritualGuide? SpiritualGuide { get; set; }
    public SessionEntity? SessionEntity { get; set; }
}
