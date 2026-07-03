import { Routes } from '@angular/router';

import { PublicScreen } from './modules/public-screen/public-screen';
import { Attendance } from './modules/attendance/attendance';
import { Settings } from './modules/settings/settings';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full'
  },
  {
    path: 'attendance',
    component: Attendance
  },
  {
    path: 'public',
    component: PublicScreen
  },
  {
    path: 'settings',
    component: Settings
  },
  {
    path: '**',
    redirectTo: 'public'
  }
];