using Labaxurias.Api.Hubs;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// =========================
// SERVICES
// =========================

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SignalR (CORRETO AQUI)
builder.Services.AddSignalR();

// DbContext + SQLite
builder.Services.AddDbContext<LabaxuriasDbContext>(options =>
{
    var dbPath = Path.GetFullPath(
        Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "database",
            "labaxurias.db"
        )
    );

    var directory = Path.GetDirectoryName(dbPath);

    if (!Directory.Exists(directory))
        Directory.CreateDirectory(directory!);

    options.UseSqlite($"Data Source={dbPath}");
});

// =========================
// APP BUILD
// =========================

var app = builder.Build();

// =========================
// PIPELINE
// =========================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// cria banco
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LabaxuriasDbContext>();
    db.Database.EnsureCreated();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// SignalR endpoint (CORRETO AQUI)
app.MapHub<CallHub>("/hubs/call");

app.Run();