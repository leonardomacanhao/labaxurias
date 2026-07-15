#!/bin/bash
set -e

echo "🚀 Iniciando configuração completa de Autenticação (Admin/User)..."

# ==========================================
# 1. BACKEND: Instalar Pacotes
# ==========================================
echo "📦 Instalando pacotes .NET..."
cd ~/Desktop/labaxurias/labaxurias/backend/src/Labaxurias.Api
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore --no-log
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --no-log

# ==========================================
# 2. BACKEND: Atualizar DbContext
# ==========================================
echo "🗄️ Atualizando LabaxuriasDbContext para suportar Identity..."
cd ../Labaxurias.Infrastructure/Persistence
# Adicionar usings no topo
sed -i '1s/^/using Microsoft.AspNetCore.Identity;\nusing Microsoft.AspNetCore.Identity.EntityFrameworkCore;\n/' LabaxuriasDbContext.cs
# Alterar herança da classe
sed -i 's/: DbContext/: IdentityDbContext<IdentityUser>/' LabaxuriasDbContext.cs

# ==========================================
# 3. BACKEND: Atualizar Program.cs (Usando Python para segurança multiline)
# ==========================================
echo "⚙️ Configurando Identity, JWT e Seed do Admin no Program.cs..."
cd ~/Desktop/labaxurias/labaxurias/backend/src/Labaxurias.Api
python3 << 'PYTHON_SCRIPT'
import re

with open('Program.cs', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar Usings
usings = """using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
"""
if "using Microsoft.AspNetCore.Identity;" not in content:
    content = usings + content

# 2. Inserir configuração de serviços ANTES de var app = builder.Build();
identity_config = """
// --- CONFIGURAÇÃO DE IDENTIDADE E JWT ---
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => {
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
}).AddEntityFrameworkStores<LabaxuriasDbContext>().AddDefaultTokenProviders();

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
}).AddJwtBearer("JwtBearer", options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "LabaxuriasAPI",
        ValidAudience = "LabaxuriasClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("LabaxuriasSuperSecretKey2024!@#MudeNoDeploy"))
    };
});
builder.Services.AddAuthorization();
// ----------------------------------------
"""
content = content.replace("var app = builder.Build();", identity_config + "\nvar app = builder.Build();")

# 3. Inserir Seed do Admin e Middlewares DEPOIS de var app = builder.Build();
seed_config = """
// --- SEED INICIAL DO ADMINISTRADOR ---
using (var scope = app.Services.CreateScope()) {
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
    
    if (!await roleManager.RoleExistsAsync("Admin")) {
        await roleManager.CreateAsync(new IdentityRole("Admin"));
        await roleManager.CreateAsync(new IdentityRole("User"));
        
        var admin = new IdentityUser { UserName = "admin", Email = "admin@labaxurias.local", EmailConfirmed = true };
        var result = await userManager.CreateAsync(admin, "131658EUliz#");
        if (result.Succeeded) {
            await userManager.AddToRoleAsync(admin, "Admin");
            Console.WriteLine("✅ Admin criado: admin / 131658EUliz#");
        }
    }
}

app.UseAuthentication(); // DEVE vir antes de UseAuthorization
app.UseAuthorization();
// -------------------------------------
"""
content = content.replace("var app = builder.Build();", "var app = builder.Build();\n" + seed_config)

with open('Program.cs', 'w', encoding='utf-8') as f:
    f.write(content)
print("Program.cs atualizado com sucesso!")
PYTHON_SCRIPT

# ==========================================
# 4. BACKEND: Criar Controllers de Auth
# ==========================================
echo "🔐 Criando Controllers de Autenticação..."
mkdir -p Modules/Auth/Controllers

cat << 'AUTH_CONTROLLER' > Modules/Auth/Controllers/AuthController.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Labaxurias.Api.Modules.Auth.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;

    public AuthController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null) return Unauthorized("Credenciais inválidas");

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded) return Unauthorized("Credenciais inválidas");

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);

        return Ok(new { token, role = roles.FirstOrDefault() ?? "User", username = user.UserName });
    }

    private string GenerateJwtToken(IdentityUser user, IList<string> roles)
    {
        var claims = new List<Claim> {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("LabaxuriasSuperSecretKey2024!@#MudeNoDeploy"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "LabaxuriasAPI",
            audience: "LabaxuriasClient",
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
public class LoginRequest { public string Username { get; set; } = ""; public string Password { get; set; } = ""; }
AUTH_CONTROLLER

cat << 'ADMIN_CONTROLLER' > Modules/Auth/Controllers/AdminUserController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Labaxurias.Api.Modules.Auth.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUserController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;

    public AdminUserController(UserManager<IdentityUser> userManager) { _userManager = userManager; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = _userManager.Users.Select(u => new { u.Id, u.UserName }).ToList();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var user = new IdentityUser { UserName = request.Username, Email = request.Username };
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);
        await _userManager.AddToRoleAsync(user, "User");
        return Ok(new { message = "Usuário criado com sucesso" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        if (user.UserName == "admin") return BadRequest("Não é possível excluir o administrador principal.");
        await _userManager.DeleteAsync(user);
        return Ok();
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(new { message = "Senha alterada com sucesso" });
    }
}
public class CreateUserRequest { public string Username { get; set; } = ""; public string Password { get; set; } = ""; }
public class ResetPasswordRequest { public string NewPassword { get; set; } = ""; }
ADMIN_CONTROLLER

# ==========================================
# 5. BACKEND: Nova Migration e Update no Banco
# ==========================================
echo "🗄️ Aplicando novas tabelas de Identity no banco de dados..."
cd ~/Desktop/labaxurias/labaxurias/backend/src/Labaxurias.Infrastructure
dotnet ef migrations add AddIdentityTables --startup-project ../Labaxurias.Api
dotnet ef database update --startup-project ../Labaxurias.Api

# ==========================================
# 6. FRONTEND: Gerar Serviços e Componentes
# ==========================================
echo "🎨 Gerando componentes e serviços Angular..."
cd ~/Desktop/labaxurias/labaxurias/frontend/labaxurias-web
ng g s services/auth --skip-tests
ng g interceptor interceptors/auth --skip-tests
mkdir -p src/app/modules/auth src/app/modules/admin

# Auth Service
cat << 'AUTH_SERVICE' > src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5291/api/auth';
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(\`\${this.apiUrl}/login\`, { username, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('username', res.username);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  getRole(): string | null { return localStorage.getItem('role'); }
  isAdmin(): boolean { return this.getRole() === 'Admin'; }
  isLoggedIn(): boolean { return !!this.getToken(); }
}
AUTH_SERVICE

# Auth Interceptor
cat << 'AUTH_INTERCEPTOR' > src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  if (token) {
    const cloned = req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } });
    return next(cloned);
  }
  return next(req);
};
AUTH_INTERCEPTOR

# Login Component
cat << 'LOGIN_COMPONENT' > src/app/modules/auth/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="login-container">
      <div class="login-box">
        <h2>🔱 Labaxurias</h2>
        <p>Faça login para continuar</p>
        <form (ngSubmit)="onSubmit()">
          <input type="text" [(ngModel)]="username" name="username" placeholder="Usuário" required class="input-field">
          <input type="password" [(ngModel)]="password" name="password" placeholder="Senha" required class="input-field">
          <button type="submit" class="btn-login" [disabled]="loading">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
          @if (error) { <p class="error">{{ error }}</p> }
        </form>
      </div>
    </div>
  \`,
  styles: [\`
    .login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #0a0a0a; }
    .login-box { background: #111; padding: 2rem; border-radius: 8px; border: 1px solid #333; width: 350px; text-align: center; }
    .input-field { width: 100%; padding: 10px; margin: 10px 0; background: #000; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; }
    .btn-login { width: 100%; padding: 10px; background: #ff3333; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; }
    .btn-login:disabled { background: #555; cursor: not-allowed; }
    .error { color: #ff3333; font-size: 0.9rem; margin-top: 10px; }
  \`]
})
export class LoginComponent {
  username = ''; password = ''; error = ''; loading = false;
  constructor(private authService: AuthService, private router: Router) {}
  onSubmit() {
    this.loading = true; this.error = '';
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        if (this.authService.isAdmin()) this.router.navigate(['/admin']);
        else this.router.navigate(['/gira']);
      },
      error: () => { this.error = 'Usuário ou senha inválidos.'; this.loading = false; }
    });
  }
}
LOGIN_COMPONENT

# Admin Users Component
cat << 'ADMIN_COMPONENT' > src/app/modules/admin/admin-users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="admin-container">
      <div class="header">
        <h2>⚙️ Gestão de Usuários (Apenas Admin)</h2>
        <button class="btn-logout" (click)="logout()">Sair</button>
      </div>
      <div class="create-user-box">
        <h3>Criar Novo Usuário</h3>
        <input [(ngModel)]="newUser.username" placeholder="Nome de usuário" class="input">
        <input [(ngModel)]="newUser.password" type="password" placeholder="Senha (mín. 8 chars, maiúscula, número, símbolo)" class="input">
        <button (click)="createUser()" class="btn-add">Criar</button>
      </div>
      <table class="users-table">
        <thead><tr><th>Usuário</th><th>Ações</th></tr></thead>
        <tbody>
          @for (user of users; track user.id) {
            <tr>
              <td>{{ user.userName }}</td>
              <td>
                @if (user.userName !== 'admin') {
                  <button (click)="resetPassword(user.id)" class="btn-action">Resetar Senha</button>
                  <button (click)="deleteUser(user.id)" class="btn-delete">Excluir</button>
                } @else { <span class="badge">Admin Principal</span> }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  \`,
  styles: [\`
    .admin-container { padding: 2rem; background: #0a0a0a; min-height: 100vh; color: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .create-user-box { background: #111; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; display: flex; gap: 10px; flex-wrap: wrap; }
    .input { padding: 8px; background: #000; border: 1px solid #444; color: #fff; border-radius: 4px; flex: 1; }
    .btn-add { padding: 8px 16px; background: #4ade80; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .users-table { width: 100%; border-collapse: collapse; background: #111; }
    .users-table th, .users-table td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
    .btn-action { background: #3b82f6; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; }
    .btn-delete { background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
    .btn-logout { background: #333; color: #fff; border: 1px solid #555; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .badge { background: #ff3333; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
  \`]
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  newUser = { username: '', password: '' };
  private apiUrl = 'http://localhost:5291/api/admin/users';
  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}
  ngOnInit() {
    if (!this.authService.isAdmin()) this.router.navigate(['/gira']);
    this.loadUsers();
  }
  loadUsers() { this.http.get<any[]>(this.apiUrl).subscribe(data => this.users = data); }
  createUser() {
    if (!this.newUser.username || !this.newUser.password) return alert('Preencha todos os campos');
    this.http.post(this.apiUrl, this.newUser).subscribe({
      next: () => { alert('Usuário criado!'); this.newUser = { username: '', password: '' }; this.loadUsers(); },
      error: (err) => alert('Erro: ' + (err.error?.title || 'Verifique a complexidade da senha (mín 8 chars, maiúscula, número e símbolo)'))
    });
  }
  deleteUser(id: string) {
    if (!confirm('Tem certeza?')) return;
    this.http.delete(\`\${this.apiUrl}/\${id}\`).subscribe(() => this.loadUsers());
  }
  resetPassword(id: string) {
    const newPass = prompt('Digite a nova senha (mín 8 chars, maiúscula, número, símbolo):');
    if (!newPass) return;
    this.http.post(\`\${this.apiUrl}/\${id}/reset-password\`, { newPassword: newPass }).subscribe({
      next: () => alert('Senha alterada com sucesso!'),
      error: () => alert('Erro ao alterar senha. Verifique as regras de complexidade.')
    });
  }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
ADMIN_COMPONENT

# Atualizar app.routes.ts
echo "🛣️ Atualizando rotas com Guards de autenticação..."
python3 << 'ROUTES_SCRIPT'
import re
with open('src/app/app.routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Adicionar imports
imports = """import { LoginComponent } from './modules/auth/login.component';
import { AdminUsersComponent } from './modules/admin/admin-users.component';
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';

const authGuard = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) return '/login';
  return true;
};

const adminGuard = () => {
  const auth = inject(AuthService);
  if (!auth.isAdmin()) return '/gira';
  return true;
};

"""
if "const authGuard" not in content:
    content = imports + content

# Substituir ou adicionar rotas
routes_block = """export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminUsersComponent, canActivate: [authGuard, adminGuard] },
  { path: 'gira', component: GiraComponent, canActivate: [authGuard] },
  { path: 'relatorios', component: ReportComponent, canActivate: [authGuard] },
  { path: 'atendimentos', component: AtendimentosComponent, canActivate: [authGuard] },
  { path: 'cadastro', component: CadastroComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];"""

# Remove old routes export if exists
content = re.sub(r'export const routes: Routes = \[[\s\S]*?\];', '', content)
content = content.rstrip() + "\n\n" + routes_block + "\n"

with open('src/app/app.routes.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Rotas atualizadas com sucesso!")
ROUTES_SCRIPT

# Atualizar app.config.ts para registrar o Interceptor
echo "🔌 Registrando Interceptor no app.config.ts..."
python3 << 'CONFIG_SCRIPT'
with open('src/app/app.config.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if "authInterceptor" not in content:
    content = content.replace(
        "import { ApplicationConfig } from '@angular/core';",
        "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';\nimport { provideHttpClient, withInterceptors } from '@angular/common/http';\nimport { authInterceptor } from './interceptors/auth.interceptor';"
    )
    content = content.replace(
        "providers: [",
        "providers: [\n    provideHttpClient(withInterceptors([authInterceptor])),"
    )
    with open('src/app/app.config.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("app.config.ts atualizado!")
else:
    print("Interceptor já registrado.")
CONFIG_SCRIPT

echo ""
echo "✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!"
echo "================================================"
echo "📌 PRÓXIMOS PASSOS:"
echo "1. Backend: cd ~/Desktop/labaxurias/labaxurias/backend/src/Labaxurias.Api && dotnet run"
echo "   (Na primeira vez, ele criará o admin: 'admin' / '131658EUliz#')"
echo "2. Frontend: cd ~/Desktop/labaxurias/labaxurias/frontend/labaxurias-web && ng serve"
echo "3. Acesse: http://localhost:4200"
echo "================================================"
