using Labaxurias.Infrastructure.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Labaxurias.Infrastructure.Persistence;

public class LabaxuriasDbContext : DbContext
{
    public LabaxuriasDbContext(DbContextOptions<LabaxuriasDbContext> options)
        : base(options)
    {
    }

    public DbSet<Medium> Mediums => Set<Medium>();
    public DbSet<SpiritualGuide> SpiritualGuides => Set<SpiritualGuide>();
    public DbSet<QueueItem> QueueItems => Set<QueueItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}