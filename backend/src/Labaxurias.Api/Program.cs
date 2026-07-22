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
//builder.Services.AddSwaggerGen();

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
// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }

app.UseCors("AllowAll");
app.UseAuthentication(); // Deve vir ANTES de UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.MapHub<CallHub>("/hubs/call");

app.Run();





