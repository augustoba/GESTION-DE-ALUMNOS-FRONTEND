import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { AlumnoAdmin } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-alumnos',
  imports: [
    FormsModule,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule,
    MatButtonModule, MatTableModule, MatProgressSpinnerModule, MatDividerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, MatTooltipModule
  ],
  templateUrl: './admin-alumnos.component.html',
  styleUrl: './admin-alumnos.component.scss'
})
export class AdminAlumnosComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);

  alumnos      = signal<AlumnoAdmin[]>([]);
  loading      = signal(false);
  buscando     = signal(false);
  busqueda     = signal('');
  modoBusqueda = signal(false);

  readonly displayedColumns = ['nombre', 'dni', 'carrera', 'estado', 'acciones'];

  get isSuperAdmin(): boolean { return this.authService.getRol() === 'SUPER_ADMIN'; }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.adminService.getAlumnos(0, 100).subscribe({
      next: res => this.alumnos.set(res.data.content),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  buscar(): void {
    const q = this.busqueda().trim();
    if (!q) { this.limpiarBusqueda(); return; }
    this.buscando.set(true);
    this.modoBusqueda.set(true);
    this.adminService.buscarAlumnos(q, q, 0, 50).subscribe({
      next: res => this.alumnos.set(res.data.content),
      error: () => { this.alumnos.set([]); this.buscando.set(false); },
      complete: () => this.buscando.set(false)
    });
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
    this.modoBusqueda.set(false);
    this.cargar();
  }

  deshabilitar(a: AlumnoAdmin): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        titulo: '¿Deshabilitar alumno?',
        mensaje: `${a.apellidos}, ${a.nombres} perderá acceso al sistema hasta que sea habilitado nuevamente.`,
        confirmLabel: 'Deshabilitar',
        cancelLabel: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.adminService.deshabilitarAlumno(a.id).subscribe({
        next: res => {
          this.snackBar.open('Alumno deshabilitado.', 'Cerrar', { duration: 3000 });
          this.actualizarFila(res.data);
        },
        error: err => this.snackBar.open(err.error?.mensaje || 'Error.', 'Cerrar', { duration: 4000 })
      });
    });
  }

  habilitar(a: AlumnoAdmin): void {
    this.adminService.habilitarAlumno(a.id).subscribe({
      next: res => {
        this.snackBar.open('Alumno habilitado.', 'Cerrar', { duration: 3000 });
        this.actualizarFila(res.data);
      },
      error: err => this.snackBar.open(err.error?.mensaje || 'Error.', 'Cerrar', { duration: 4000 })
    });
  }

  private actualizarFila(actualizado: AlumnoAdmin): void {
    this.alumnos.update(lista =>
      lista.map(a => a.id === actualizado.id ? actualizado : a)
    );
  }

  verDetalle(a: AlumnoAdmin): void { this.router.navigate(['/admin/alumnos', a.id]); }

  irAPre():      void { this.router.navigate(['/admin/lista']); }
  irACarreras(): void { this.router.navigate(['/admin/carreras']); }
  irADocentes(): void { this.router.navigate(['/admin/docentes']); }
  irAUsuarios(): void { this.router.navigate(['/admin/usuarios']); }
  logout():      void { this.authService.logout(); }
}
