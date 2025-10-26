import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Home } from './pages/dashboard/home/home';
import { authGuard } from '../app/core/guards/auth.guard';


import { LayoutComponent } from './layout/layout';
import { Configuracion } from './pages/dashboard/configuracion/configuracion';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: Home },
       { path: 'configuracion', component: Configuracion },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

