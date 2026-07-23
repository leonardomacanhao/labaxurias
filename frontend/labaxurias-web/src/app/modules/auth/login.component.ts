import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-container">
        <div class="login-card">
          <div class="logo-section">
            <div class="logo-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22V8" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M12 8L12 3" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M12 3L8 6" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M12 3L16 6" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M12 3L12 6" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M8 6L8 8" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M16 6L16 8" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M9 22L15 22" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M10 20L14 20" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <h1 class="title">Labaxurias</h1>
            <p class="subtitle">Sistema de Gestão de Macumba</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="input-group">
              <label class="input-label">Usuário</label>
              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <input type="text" [(ngModel)]="username" name="username" placeholder="Digite seu usuário" required class="input-field">
              </div>
            </div>

            <div class="input-group">
              <label class="input-label">Senha</label>
              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="10" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 10V7C10 5.89543 10.8954 5 12 5C13.1046 5 14 5.89543 14 7V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <input type="password" [(ngModel)]="password" name="password" placeholder="Digite sua senha" required class="input-field">
              </div>
            </div>

            <button type="submit" class="btn-login" [disabled]="loading">
              <span class="btn-text">{{ loading ? 'Entrando...' : 'Acessar Sistema' }}</span>
              <div class="btn-icon" *ngIf="!loading">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>

            <div class="error-message" *ngIf="error">
              <div class="error-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M12 8V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                </svg>
              </div>
              <span>{{ error }}</span>
            </div>
          </form>

          <div class="footer">
            <p class="footer-text">Acesso restrito a membros autorizados</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      position: relative;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background:
        radial-gradient(circle at top left, rgba(226, 72, 31, 0.16) 0%, transparent 34%),
        linear-gradient(135deg, #1a110a 0%, #120804 45%, #2a170d 100%);
      overflow: hidden;
      padding: 24px;
    }

    .login-wrapper::before,
    .login-wrapper::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }

    .login-wrapper::before {
      width: 30rem;
      height: 30rem;
      top: -12rem;
      right: -10rem;
      background: radial-gradient(circle, rgba(226, 72, 31, 0.28) 0%, rgba(226, 72, 31, 0) 70%);
    }

    .login-wrapper::after {
      width: 24rem;
      height: 24rem;
      bottom: -10rem;
      left: -8rem;
      background: radial-gradient(circle, rgba(201, 151, 63, 0.16) 0%, rgba(201, 151, 63, 0) 70%);
    }

    .login-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 560px;
      padding: 24px;
    }

    .login-card {
      background: linear-gradient(145deg, rgba(26, 16, 10, 0.97) 0%, rgba(14, 8, 5, 0.97) 100%);
      backdrop-filter: blur(18px);
      border-radius: 28px;
      padding: 56px 48px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(232, 188, 114, 0.24);
    }

    .logo-section {
      text-align: center;
      margin-bottom: 48px;
    }

    .logo-icon {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      filter: drop-shadow(0 0 20px rgba(226, 72, 31, 0.28));
    }

    .title {
      font-family: 'Cinzel', serif;
      font-size: clamp(2.2rem, 4.6vw, 3rem);
      font-weight: 700;
      color: transparent;
      margin: 0 0 12px 0;
      letter-spacing: 0.08em;
      line-height: 1.05;
      white-space: nowrap;
      background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 44%, var(--ember-bright) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      text-shadow: 0 0 24px rgba(226, 72, 31, 0.18);
    }

    .subtitle {
      font-size: 20px;
      color: var(--text-secondary);
      margin: 0;
      font-weight: 500;
      letter-spacing: 1px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .input-label {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gold-bright);
    }

    .input-field {
      width: 100%;
      padding: 18px 18px 18px 56px;
      background: rgba(32, 21, 14, 0.92);
      border: 1px solid rgba(232, 188, 114, 0.16);
      border-radius: 14px;
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .input-field::placeholder {
      color: var(--text-secondary);
    }

    .input-field:focus {
      outline: none;
      border-color: var(--ember-bright);
      background: rgba(26, 18, 12, 1);
      box-shadow: 0 0 0 4px rgba(226, 72, 31, 0.16);
    }

    .btn-login {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      width: 100%;
      padding: 20px 32px;
      background: linear-gradient(135deg, var(--ember-bright) 0%, var(--ember) 100%);
      border: none;
      border-radius: 14px;
      color: #fbe6d8;
      font-size: 20px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 12px;
      box-shadow: 0 10px 28px rgba(226, 72, 31, 0.28);
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 16px 36px rgba(226, 72, 31, 0.38);
    }

    .btn-login:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-login:disabled {
      background: linear-gradient(135deg, #4a2c1c 0%, #2e1b12 100%);
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-text {
      font-size: 18px;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }

    .btn-login:hover .btn-icon {
      transform: translateX(6px);
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      background: rgba(226, 72, 31, 0.12);
      border: 1px solid rgba(226, 72, 31, 0.35);
      border-radius: 10px;
      color: #ffb08d;
      font-size: 16px;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    }

    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ember-bright);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 28px;
      border-top: 1px solid var(--border);
    }

    .footer-text {
      font-size: 16px;
      color: var(--text-secondary);
      margin: 0;
      font-style: italic;
      font-weight: 500;
    }

    svg {
      stroke: currentColor;
      fill: none;
    }

    .logo-icon svg {
      width: 80px;
      height: 80px;
    }

    @media (max-width: 600px) {
      .login-card {
        padding: 40px 28px;
      }
      .logo-icon svg {
        width: 64px;
        height: 64px;
      }
      .title {
        font-size: clamp(1.9rem, 7vw, 2.4rem);
        white-space: normal;
      }
      .subtitle {
        font-size: 18px;
      }
      .input-field {
        font-size: 16px;
        padding: 16px 16px 16px 50px;
      }
      .btn-login {
        font-size: 18px;
        padding: 18px 28px;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    console.log('LoginComponent INICIALIZADO');
  }

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