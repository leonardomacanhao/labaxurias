import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-box">
        <h2>🔱 Labaxurias</h2>
        <p>Faça login para continuar</p>
        <form (ngSubmit)="onSubmit()">
          <input type="text" [(ngModel)]="username" name="username" placeholder="Usuário" required class="input-field">
          <input type="password" [(ngModel)]="password" name="password" placeholder="Senha" required class="input-field">
          <button type="submit" class="btn-login" [disabled]="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
          @if (error) { <p class="error">{{ error }}</p> }
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #0a0a0a; }
    .login-box { background: #111; padding: 2rem; border-radius: 8px; border: 1px solid #333; width: 350px; text-align: center; }
    .input-field { width: 100%; padding: 10px; margin: 10px 0; background: #000; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; }
    .btn-login { width: 100%; padding: 10px; background: #ff3333; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; }
    .btn-login:disabled { background: #555; cursor: not-allowed; }
    .error { color: #ff3333; font-size: 0.9rem; margin-top: 10px; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin-users']);
        } else {
          this.router.navigate(['/gira']);
        }
      },
      error: () => {
        this.error = 'Usuário ou senha inválidos.';
        this.loading = false;
      }
    });
  }
}
