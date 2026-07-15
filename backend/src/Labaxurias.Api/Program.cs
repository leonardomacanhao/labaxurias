using Labaxurias.Api.Hubs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Labaxurias.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// 1. Controllers e Swagger
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Banco de Dados (SQLite)
builder.Services.AddDbContext<LabaxuriasDbContext>(options =>
    options.UseSqlite("Data Source=labaxurias.db"));

// 3. Identity (Registra UserManager e SignInManager)
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<LabaxuriasDbContext>()
.AddDefaultTokenProviders();

// 4. Autenticação JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "LabaxuriasAPI",
        ValidAudience = "LabaxuriasClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("LabaxuriasSuperSecretKey2024!@#MudeNoDeploy"))
    };
});

// 5. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});

var app = builder.Build();

// 6. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication(); // Deve vir ANTES de UseAuthorization
app.UseAuthorization();

app.MapControllers();

// 7. Seed Automático do Admin (Garante que o admin exista ao iniciar)
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

    if (!await roleManager.RoleExistsAsync("Admin"))
    {
        await roleManager.CreateAsync(new IdentityRole("Admin"));
        await roleManager.CreateAsync(new IdentityRole("User"));
    }

    var adminEmail = "admin@labaxurias.local";
    var adminUser = await userManager.FindByEmailAsync(adminEmail);
    if (adminUser == null)
    {
        adminUser = new IdentityUser { UserName = "admin", Email = adminEmail, EmailConfirmed = true };
        var result = await userManager.CreateAsync(adminUser, "131658EUliz#");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
            Console.WriteLine("✅ Admin criado automaticamente: admin / 131658EUliz#");
        }
    }
}

app.MapHub<CallHub>("/hubs/call");
app.Run();




