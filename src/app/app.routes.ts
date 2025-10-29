import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Home } from './pages/dashboard/home/home';
import { authGuard } from '../app/core/guards/auth.guard';


//---------------------Layout------------------------------\\
import { LayoutComponent } from './layout/layout';
import { Configuracion } from './pages/dashboard/configuracion/configuracion';
//--------------------------------------------------------\\


//---------------------Usuarios------------------------------\\
import { UsuariosList } from './pages/dashboard/usuarios/list/usuarios-list';
import { UsuariosForm } from './pages/dashboard/usuarios/form/usuarios-form';
import { UsuariosDetalle } from './pages/dashboard/usuarios/detalle/usuarios-detalle';
//----------------------------------------------------------------------------------



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
       // --- rutas hijas de Usuarios ---
      // 👇 Aquí van las rutas de usuarios
      { path: 'usuarios', component: UsuariosList },
      { path: 'usuarios/form', component: UsuariosForm },
      { path: 'usuarios/form/:id', component: UsuariosForm },
      { path: 'usuarios/detalle/:id', component: UsuariosDetalle },
      // -------------------------------
      { path: '', redirectTo: 'home', pathMatch: 'full' }

    ]
  },
  { path: '**', redirectTo: 'login' }
];

