using Labaxurias.Api.Hubs;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// =========================
// SERVICES
// =========================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SignalR
builder.Services.AddSignalR();

// CORS (CORRETO)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocal", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true) // <- IMPORTANTE p/ dev local + SignalR
            .AllowCredentials();
    });
});

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
// APP
// =========================

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS
app.UseHttpsRedirection();


app.UseRouting();

// CORS (TEM QUE VIR AQUI)
app.UseCors("AllowLocal");

app.UseAuthorization();

// Controllers
app.MapControllers();

// SignalR
app.MapHub<CallHub>("/hubs/call");

// Criação do banco
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LabaxuriasDbContext>();
    db.Database.EnsureCreated();
}

app.Run();