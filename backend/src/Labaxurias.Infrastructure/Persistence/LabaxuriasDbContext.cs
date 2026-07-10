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
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionEntity> SessionEntities => Set<SessionEntity>();
    public DbSet<QueueItem> QueueItems => Set<QueueItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Session -> SessionEntity
        modelBuilder.Entity<SessionEntity>()
            .HasOne(se => se.Session)
            .WithMany(s => s.SessionEntities)
            .HasForeignKey(se => se.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // SessionEntity -> SpiritualGuide
        modelBuilder.Entity<SessionEntity>()
            .HasOne(se => se.SpiritualGuide)
            .WithMany()
            .HasForeignKey(se => se.SpiritualGuideId)
            .OnDelete(DeleteBehavior.Cascade);

        // QueueItem -> SessionEntity (opcional)
        modelBuilder.Entity<QueueItem>()
            .HasOne(qi => qi.SessionEntity)
            .WithMany(se => se.QueueItems)
            .HasForeignKey(qi => qi.SessionEntityId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired(false);

        // QueueItem -> SpiritualGuide (opcional, para compatibilidade)
        modelBuilder.Entity<QueueItem>()
            .HasOne(qi => qi.SpiritualGuide)
            .WithMany()
            .HasForeignKey(qi => qi.SpiritualGuideId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
