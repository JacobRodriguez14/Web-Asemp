import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { HomeComponent } from './pages/dashboard/home/home';
import { authGuard } from '../app/core/guards/auth.guard';
import { permisoGuard } from '../app/core/guards/permiso.guard';

// Layout
import { LayoutComponent } from './layout/layout';
import { Configuracion } from './pages/dashboard/configuracion/configuracion';

// Usuarios
import { UsuariosList } from './pages/dashboard/usuarios/list/usuarios-list';
import { UsuariosForm } from './pages/dashboard/usuarios/form/usuarios-form';
import { UsuariosDetalle } from './pages/dashboard/usuarios/detalle/usuarios-detalle';

// Clientes
import { ClientesListComponent } from './pages/dashboard/clientes/list/clientes-list';

// Departamentos
import { DepartamentosList } from './pages/dashboard/departamentos/list/departamentos-list';
import { DepartamentosFormComponent } from './pages/dashboard/departamentos/form/departamentos-form';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },

      // ================================
      // CONFIGURACIÓN (solo Admin)
      // ================================
      {
  path: 'configuracion',
  component: Configuracion,
  canActivate: [permisoGuard],
  data: { soloAdmin: true }
},

      // ================================
      // USUARIOS
      // ================================
      {
        path: 'usuarios',
        component: UsuariosList,
        canActivate: [permisoGuard],
        data: { permiso: 'usuarios.ver' }
      },
      {
        path: 'usuarios/form',
        component: UsuariosForm,
        canActivate: [permisoGuard],
        data: { permiso: 'usuarios.crear' }
      },
      {
        path: 'usuarios/form/:id',
        component: UsuariosForm,
        canActivate: [permisoGuard],
        data: { permiso: 'usuarios.editar' }
      },
      {
        path: 'usuarios/detalle/:id',
        component: UsuariosDetalle,
        canActivate: [permisoGuard],
        data: { permiso: 'usuarios.ver' }
      },

      // ================================
      // CLIENTES
      // ================================
      {
        path: 'clientes',
        component: ClientesListComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'clientes.ver' }
      },

      // ================================
      // DEPARTAMENTOS
      // ================================
      {
        path: 'departamentos',
        component: DepartamentosList,
        canActivate: [permisoGuard],
        data: { permiso: 'departamentos.ver' }
      },
      {
        path: 'departamentos/form',
        component: DepartamentosFormComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'departamentos.crear' }
      },
      {
        path: 'departamentos/form/:id',
        component: DepartamentosFormComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'departamentos.editar' }
      },

      // ================================
      // SAT
      // ================================
      {
        path: 'sat',
        loadComponent: () =>
          import('./pages/dashboard/sat/sat').then(m => m.SatComponent),
        canActivate: [permisoGuard],
        data: { permiso: 'sat.ver' }
      },

      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
