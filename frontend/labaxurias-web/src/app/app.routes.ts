import { Routes } from '@angular/router';
import { inject } from '@angular/core';

import { PublicScreen } from './modules/public-screen/public-screen';
import { Settings } from './modules/settings/settings';
import { AdminLayoutComponent } from './core/components/admin-layout/admin-layout.component';
import { CadastroComponent } from './modules/cadastro/cadastro.component';
import { AtendimentosComponent } from './modules/atendimentos/atendimentos.component';
import { GiraComponent } from './modules/gira/gira.component';
import { ReportComponent } from './modules/report/report.component';
import { LoginComponent } from './modules/auth/login.component';
import { AdminUsersComponent } from './modules/admin/admin-users.component';
import { AuthService } from './services/auth.service';

// Guard: exige estar logado
const authGuard = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    console.warn('🔒 Guard: Usuário não logado. Redirecionando para /login');
    return '/login';
  }
  return true;
};

// Guard: exige ser Admin
const adminGuard = () => {
  const auth = inject(AuthService);
  if (!auth.isAdmin()) {
    console.warn('⛔ Guard: Usuário não é Admin. Redirecionando para /gira');
    return '/gira';
  }
  return true;
};

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'public',
    component: PublicScreen
  },
  {
    path: 'admin-users',
    component: AdminUsersComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard], // <-- PROTEGE TODAS AS ROTAS FILHAS
    children: [
      { path: 'gira', component: GiraComponent },
      { path: 'atendimentos', component: AtendimentosComponent },
      { path: 'settings', component: Settings },
      { path: 'cadastros', component: CadastroComponent },
      { path: 'relatorios', component: ReportComponent },
      { path: '', redirectTo: 'gira', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
