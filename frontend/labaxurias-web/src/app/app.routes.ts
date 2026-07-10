import { Routes } from '@angular/router';

import { PublicScreen } from './modules/public-screen/public-screen';
import { Settings } from './modules/settings/settings';
import { AdminLayoutComponent } from './core/components/admin-layout/admin-layout.component';
import { CadastroComponent } from './modules/cadastro/cadastro.component';
import { AtendimentosComponent } from './modules/atendimentos/atendimentos.component';
import { GiraComponent } from './modules/gira/gira.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full'
  },
  {
    path: 'public',
    component: PublicScreen
  },
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: 'gira',
        component: GiraComponent
      },
      {
        path: 'atendimentos',
        component: AtendimentosComponent
      },
      {
        path: 'settings',
        component: Settings
      },
      {
        path: 'cadastros',
        component: CadastroComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'public'
  }
];
