using Labaxurias.Infrastructure.Domain.Entities;

public class QueueItem
{
    public Guid Id { get; set; }

    public string ClientName { get; set; } = string.Empty;

    public Guid SpiritualGuideId { get; set; }

    public SpiritualGuide? SpiritualGuide { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsCalled { get; set; } = false;

    public DateTime? CalledAt { get; set; }

    public int Order { get; set; }
}