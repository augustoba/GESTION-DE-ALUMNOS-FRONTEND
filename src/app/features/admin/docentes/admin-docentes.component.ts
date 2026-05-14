import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocenteResponse } from '../../../core/models/api-response.model';
import { DocenteFormDialogComponent } from './docente-form-dialog.component';

@Component({
  selector: 'app-admin-docentes',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatTooltipModule, MatListModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './admin-docentes.component.html',
  styleUrl: './admin-docentes.component.scss'
})
export class AdminDocentesComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);

  docentes = signal<DocenteResponse[]>([]);
  loading  = signal(false);

  displayedColumns = ['nombre', 'dni', 'email', 'telefono', 'estado', 'acciones'];

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.adminService.getDocentesTodos().subscribe({
      next: res => { this.docentes.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  nuevo() {
    const ref = this.dialog.open(DocenteFormDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.adminService.crearDocente(result).subscribe({
        next: res => {
          this.snackBar.open(
            `Docente creado. Contraseña inicial: ${result.dni}`,
            'OK', { duration: 6000 }
          );
          this.cargar();
        },
        error: err => {
          const msg = err?.error?.mensaje || 'Error al crear el docente';
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        }
      });
    });
  }

  editar(docente: DocenteResponse) {
    const ref = this.dialog.open(DocenteFormDialogComponent, { width: '500px', data: docente });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.adminService.actualizarDocente(docente.id, result).subscribe({
        next: () => { this.snackBar.open('Docente actualizado', 'OK', { duration: 3000 }); this.cargar(); },
        error: err => {
          const msg = err?.error?.mensaje || 'Error al actualizar';
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        }
      });
    });
  }

  toggleEstado(docente: DocenteResponse) {
    const nuevoEstado = !docente.activo;
    const accion = nuevoEstado ? 'dar de alta' : 'dar de baja';
    if (!confirm(`¿Deseas ${accion} a ${docente.nombres} ${docente.apellidos}?`)) return;

    this.adminService.cambiarEstadoDocente(docente.id, nuevoEstado).subscribe({
      next: () => {
        const msg = nuevoEstado ? 'Docente dado de alta' : 'Docente dado de baja';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.cargar();
      },
      error: () => this.snackBar.open('Error al cambiar estado', 'OK', { duration: 3000 })
    });
  }

  verDetalle(id: number) { this.router.navigate(['/admin/docentes', id]); }
  irALista()     { this.router.navigate(['/admin/lista']); }
  irACarreras()  { this.router.navigate(['/admin/carreras']); }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
