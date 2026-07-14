namespace Labaxurias.Infrastructure.Domain.Entities;

public class SpiritualGuide
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public Guid MediumId { get; set; }

    public Medium? Medium { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

     public bool IsActive { get; set; } = true;
}