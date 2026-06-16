import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminService, ComisionRequest } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { CarreraDetalle, AnioCarreraResponse, MateriaResponse, ComisionResponse, DocenteResumen } from '../../../core/models/api-response.model';
import { MateriaFormDialogComponent } from './materia-form-dialog.component';
import { ComisionFormDialogComponent } from './comision-form-dialog.component';

@Component({
  selector: 'app-admin-carrera-detalle',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatCardModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatExpansionModule, MatListModule, MatDividerModule,
    MatChipsModule, MatTooltipModule, MatBadgeModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './admin-carrera-detalle.component.html',
  styleUrl: './admin-carrera-detalle.component.scss'
})
export class AdminCarreraDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  protected router = inject(Router);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  carrera = signal<CarreraDetalle | null>(null);
  loading = signal(false);
  docentes = signal<DocenteResumen[]>([]);
  cantAniosCtrl = new FormControl(3, [Validators.required, Validators.min(1), Validators.max(10)]);

  private carreraId!: number;

  ngOnInit() {
    this.carreraId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDocentes();
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.adminService.getCarreraDetalle(this.carreraId).subscribe({
      next: res => {
        this.carrera.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  cargarDocentes() {
    this.adminService.getDocentes().subscribe({
      next: res => this.docentes.set(res.data),
      error: () => {}
    });
  }

  /** Crea años 1, 2, ..., N de una vez (para carrera recién configurada) */
  configurarAnios() {
    const cant = this.cantAniosCtrl.value;
    if (!cant || cant < 1) return;

    const calls = Array.from({ length: cant }, (_, i) =>
      this.adminService.agregarAnio(this.carreraId, { numeroAnio: i + 1 })
    );

    this.loading.set(true);
    forkJoin(calls).subscribe({
      next: () => {
        this.snackBar.open(`${cant} año${cant > 1 ? 's' : ''} configurado${cant > 1 ? 's' : ''}`, 'OK', { duration: 2500 });
        this.cargar();
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Error al configurar los años';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.cargar();
      }
    });
  }

  /** Agrega el siguiente año correlativo al último existente */
  agregarSiguienteAnio() {
    const anios = this.carrera()?.anios ?? [];
    const siguiente = anios.length > 0 ? Math.max(...anios.map(a => a.numeroAnio)) + 1 : 1;

    this.adminService.agregarAnio(this.carreraId, { numeroAnio: siguiente }).subscribe({
      next: () => {
        this.snackBar.open(`${siguiente}° año agregado`, 'OK', { duration: 2500 });
        this.cargar();
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Error al agregar el año';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
      }
    });
  }

  eliminarAnio(anioId: number, numeroAnio: number) {
    if (!confirm(`¿Eliminar el ${numeroAnio}° año y todas sus materias?`)) return;
    this.adminService.eliminarAnio(anioId).subscribe({
      next: () => {
        this.snackBar.open('Año eliminado', 'OK', { duration: 2500 });
        this.cargar();
      },
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
    });
  }

  agregarMateria(anioId: number) {
    const ref = this.dialog.open(MateriaFormDialogComponent, {
      width: '520px',
      data: { materia: null, docentes: this.docentes() }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.adminService.agregarMateria(anioId, result).subscribe({
        next: () => {
          this.snackBar.open('Materia agregada', 'OK', { duration: 2500 });
          this.cargar();
        },
        error: () => this.snackBar.open('Error al agregar materia', 'OK', { duration: 3000 })
      });
    });
  }

  editarMateria(materia: MateriaResponse) {
    const ref = this.dialog.open(MateriaFormDialogComponent, {
      width: '520px',
      data: { materia, docentes: this.docentes() }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.adminService.actualizarMateria(materia.id, result).subscribe({
        next: () => {
          this.snackBar.open('Materia actualizada', 'OK', { duration: 2500 });
          this.cargar();
        },
        error: () => this.snackBar.open('Error al actualizar', 'OK', { duration: 3000 })
      });
    });
  }

  eliminarMateria(materiaId: number, nombre: string) {
    if (!confirm(`¿Eliminar la materia "${nombre}"?`)) return;
    this.adminService.eliminarMateria(materiaId).subscribe({
      next: () => {
        this.snackBar.open('Materia eliminada', 'OK', { duration: 2500 });
        this.cargar();
      },
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
    });
  }

  agregarComision(anioId: number) {
    const ref = this.dialog.open(ComisionFormDialogComponent, {
      width: '420px',
      data: { comision: null }
    });
    ref.afterClosed().subscribe((result: ComisionRequest | undefined) => {
      if (!result) return;
      this.adminService.agregarComision(anioId, result).subscribe({
        next: () => {
          this.snackBar.open('Comisión agregada', 'OK', { duration: 2500 });
          this.cargar();
        },
        error: err => this.snackBar.open(err.error?.mensaje ?? 'Error al agregar comisión', 'OK', { duration: 3000 })
      });
    });
  }

  editarComision(comision: ComisionResponse) {
    const ref = this.dialog.open(ComisionFormDialogComponent, {
      width: '420px',
      data: { comision }
    });
    ref.afterClosed().subscribe((result: ComisionRequest | undefined) => {
      if (!result) return;
      this.adminService.actualizarComision(comision.id, result).subscribe({
        next: () => {
          this.snackBar.open('Comisión actualizada', 'OK', { duration: 2500 });
          this.cargar();
        },
        error: err => this.snackBar.open(err.error?.mensaje ?? 'Error al actualizar', 'OK', { duration: 3000 })
      });
    });
  }

  eliminarComision(comisionId: number, nombre: string) {
    if (!confirm(`¿Eliminar la comisión "${nombre}"? Se perderá la asignación de todos sus alumnos.`)) return;
    this.adminService.eliminarComision(comisionId).subscribe({
      next: () => {
        this.snackBar.open('Comisión eliminada', 'OK', { duration: 2500 });
        this.cargar();
      },
      error: err => this.snackBar.open(err.error?.mensaje ?? 'Error al eliminar', 'OK', { duration: 3000 })
    });
  }

  diaSemanaLabel(dia: string | null): string {
    const dias: Record<string, string> = {
      LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
      JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom'
    };
    return dia ? (dias[dia] ?? dia) : '';
  }

  volver() {
    this.router.navigate(['/admin/carreras']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
