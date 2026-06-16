import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { AdminService, CarreraRequest } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Carrera } from '../../../core/models/api-response.model';
import { CarreraFormDialogComponent } from './carrera-form-dialog.component';

@Component({
  selector: 'app-admin-carreras',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule,
    MatTooltipModule, MatListModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './admin-carreras.component.html',
  styleUrl: './admin-carreras.component.scss'
})
export class AdminCarrerasComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  carreras = signal<Carrera[]>([]);
  loading = signal(false);

  displayedColumns = ['nombre', 'descripcion', 'activa', 'acciones'];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.adminService.getCarreras().subscribe({
      next: res => {
        this.carreras.set(res.data as any[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  verDetalle(id: number) {
    this.router.navigate(['/admin/carreras', id]);
  }

  nueva() {
    const ref = this.dialog.open(CarreraFormDialogComponent, { width: '480px', data: null });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.crearCarrera(result).subscribe({
          next: () => {
            this.snackBar.open('Carrera creada', 'OK', { duration: 3000 });
            this.cargar();
          },
          error: () => this.snackBar.open('Error al crear la carrera', 'OK', { duration: 3000 })
        });
      }
    });
  }

  editar(carrera: any) {
    const ref = this.dialog.open(CarreraFormDialogComponent, {
      width: '480px',
      data: carrera
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.actualizarCarrera(carrera.id, result).subscribe({
          next: () => {
            this.snackBar.open('Carrera actualizada', 'OK', { duration: 3000 });
            this.cargar();
          },
          error: () => this.snackBar.open('Error al actualizar', 'OK', { duration: 3000 })
        });
      }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar esta carrera? Se eliminarán todos sus años y materias.')) return;
    this.adminService.eliminarCarrera(id).subscribe({
      next: () => {
        this.snackBar.open('Carrera eliminada', 'OK', { duration: 3000 });
        this.cargar();
      },
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
    });
  }

  irALista() {
    this.router.navigate(['/admin/lista']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
