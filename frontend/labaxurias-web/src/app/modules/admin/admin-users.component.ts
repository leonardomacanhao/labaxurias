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
  template: `
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
                } @else {
                  <span class="badge">Admin Principal</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
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
  `]
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  newUser = { username: '', password: '' };
  private apiUrl = 'http://localhost:5291/api/admin/users';

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/gira']);
    }
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any[]>(this.apiUrl).subscribe(data => this.users = data);
  }

  createUser() {
    if (!this.newUser.username || !this.newUser.password) return alert('Preencha todos os campos');
    this.http.post(this.apiUrl, this.newUser).subscribe({
      next: () => { 
        alert('Usuário criado com sucesso!'); 
        this.newUser = { username: '', password: '' }; 
        this.loadUsers(); 
      },
      error: (err) => alert('Erro: ' + (err.error?.title || 'Verifique a complexidade da senha'))
    });
  }

  deleteUser(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => this.loadUsers());
  }

  resetPassword(id: string) {
    const newPass = prompt('Digite a nova senha (mín 8 chars, maiúscula, número, símbolo):');
    if (!newPass) return;
    this.http.post(`${this.apiUrl}/${id}/reset-password`, { newPassword: newPass }).subscribe({
      next: () => alert('Senha alterada com sucesso!'),
      error: () => alert('Erro ao alterar senha. Verifique as regras de complexidade.')
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
