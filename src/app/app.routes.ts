import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { HomeComponent } from './pages/dashboard/home/home';
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

//---------------------Clientes------------------------------\\
import { ClientesListComponent } from './pages/dashboard/clientes/list/clientes-list';
//----------------------------------------------------------------------------------

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'configuracion', component: Configuracion },

      // --- rutas de Usuarios ---
      { path: 'usuarios', component: UsuariosList },
      { path: 'usuarios/form', component: UsuariosForm },
      { path: 'usuarios/form/:id', component: UsuariosForm },
      { path: 'usuarios/detalle/:id', component: UsuariosDetalle },

      // --- rutas de Clientes ---
      { path: 'clientes', component: ClientesListComponent },
      // (el formulario se abre como modal dentro de la lista)
      // -------------------------

      //--- sat ---\\
      { path: 'sat', loadComponent: () => import('./pages/dashboard/sat/sat').then(m => m.SatComponent)},


      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
