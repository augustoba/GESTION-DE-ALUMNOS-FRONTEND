import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { docenteGuard } from './core/guards/docente.guard';
import { superAdminGuard } from './core/guards/superadmin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'cambiar-password',
    loadComponent: () =>
      import('./features/auth/cambiar-password/cambiar-password.component').then(m => m.CambiarPasswordComponent)
  },
  {
    path: 'activar-cuenta',
    loadComponent: () =>
      import('./features/auth/activar/activar-cuenta.component').then(m => m.ActivarCuentaComponent)
  },
  {
    path: 'solicitar-turno',
    loadComponent: () =>
      import('./features/turnos/solicitar-turno.component').then(m => m.SolicitarTurnoComponent)
  },
  {
    path: 'preinscripcion',
    loadComponent: () =>
      import('./features/preinscripcion/form/preinscripcion-form.component').then(
        m => m.PreinscripcionFormComponent
      )
    // public — aspirantes no tienen cuenta
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'lista', pathMatch: 'full' },
      {
        path: 'lista',
        loadComponent: () =>
          import('./features/admin/lista/admin-lista.component').then(m => m.AdminListaComponent)
      },
      {
        path: 'revision/:id',
        loadComponent: () =>
          import('./features/admin/revision/admin-revision.component').then(m => m.AdminRevisionComponent)
      },
      {
        path: 'carreras',
        loadComponent: () =>
          import('./features/admin/carreras/admin-carreras.component').then(m => m.AdminCarrerasComponent)
      },
      {
        path: 'carreras/:id',
        loadComponent: () =>
          import('./features/admin/carreras/admin-carrera-detalle.component').then(m => m.AdminCarreraDetalleComponent)
      },
      {
        path: 'docentes',
        loadComponent: () =>
          import('./features/admin/docentes/admin-docentes.component').then(m => m.AdminDocentesComponent)
      },
      {
        path: 'docentes/:id',
        loadComponent: () =>
          import('./features/admin/docentes/admin-docente-detalle.component').then(m => m.AdminDocenteDetalleComponent)
      },
      {
        path: 'alumnos',
        loadComponent: () =>
          import('./features/admin/alumnos/admin-alumnos.component').then(m => m.AdminAlumnosComponent)
      },
      {
        path: 'usuarios',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent)
      }
    ]
  },
  {
    path: 'docente',
    canActivate: [docenteGuard],
    children: [
      { path: '', redirectTo: 'portal', pathMatch: 'full' },
      {
        path: 'portal',
        loadComponent: () =>
          import('./features/docente/portal/docente-portal.component').then(m => m.DocentePortalComponent)
      },
      {
        path: 'alumnos/:id',
        loadComponent: () =>
          import('./features/docente/alumno-detalle/docente-alumno-detalle.component').then(m => m.DocenteAlumnoDetalleComponent)
      }
    ]
  }
];
