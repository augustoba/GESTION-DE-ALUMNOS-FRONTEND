import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { MateriaResponse, CarreraDetalle, DocenteResponse } from '../../../core/models/api-response.model';
import { MateriaGestionFormDialogComponent } from './materia-gestion-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-materias',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatTooltipModule, MatDividerModule, MatListModule,
    RouterLink
  ],
  templateUrl: './admin-materias.component.html',
  styleUrl: './admin-materias.component.scss'
})
export class AdminMateriasComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);

  materias         = signal<MateriaResponse[]>([]);
  loading          = signal(false);
  displayedColumns = ['nombre', 'carrera', 'docente', 'horarios', 'acciones'];

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.adminService.getTodasMaterias().subscribe({
      next: res => { this.materias.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  nueva() {
    this.loading.set(true);
    forkJoin({
      carrerasBasicas: this.adminService.getCarreras(),
      docentes:        this.adminService.getDocentesTodos()
    }).subscribe({
      next: ({ carrerasBasicas, docentes }) => {
        const ids = carrerasBasicas.data.map(c => c.id);
        if (ids.length === 0) {
          this.loading.set(false);
          this.snackBar.open('No hay carreras creadas. Creá una carrera primero.', 'OK', { duration: 4000 });
          return;
        }
        forkJoin(ids.map(id => this.adminService.getCarreraDetalle(id))).subscribe({
          next: detalles => {
            this.loading.set(false);
            const carreras: CarreraDetalle[] = detalles.map(r => r.data);
            this.abrirDialog(null, carreras, docentes.data);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  editar(materia: MateriaResponse) {
    this.loading.set(true);
    forkJoin({
      carrerasBasicas: this.adminService.getCarreras(),
      docentes:        this.adminService.getDocentesTodos()
    }).subscribe({
      next: ({ carrerasBasicas, docentes }) => {
        const ids = carrerasBasicas.data.map(c => c.id);
        forkJoin(ids.map(id => this.adminService.getCarreraDetalle(id))).subscribe({
          next: detalles => {
            this.loading.set(false);
            const carreras: CarreraDetalle[] = detalles.map(r => r.data);
            this.abrirDialog(materia, carreras, docentes.data);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  private abrirDialog(materia: MateriaResponse | null, carreras: CarreraDetalle[], docentes: DocenteResponse[]) {
    const ref = this.dialog.open(MateriaGestionFormDialogComponent, {
      width: '580px',
      data: { materia, carreras, docentes }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const obs$ = materia
        ? this.adminService.actualizarMateriaGestion(materia.id, result)
        : this.adminService.crearMateriaGestion(result);
      obs$.subscribe({
        next: () => {
          this.snackBar.open(materia ? 'Materia actualizada' : 'Materia creada', 'OK', { duration: 3000 });
          this.cargar();
        },
        error: err => this.snackBar.open(err?.error?.mensaje || 'Error al guardar', 'OK', { duration: 4000 })
      });
    });
  }

  eliminar(materia: MateriaResponse) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar materia',
        mensaje: `¿Eliminar la materia "${materia.nombre}"? Esta acción no se puede deshacer.`
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.adminService.eliminarMateriaGestion(materia.id).subscribe({
        next: () => { this.snackBar.open('Materia eliminada', 'OK', { duration: 3000 }); this.cargar(); },
        error: err => this.snackBar.open(err?.error?.mensaje || 'Error al eliminar', 'OK', { duration: 4000 })
      });
    });
  }

  horarioResumen(m: MateriaResponse): string {
    if (!m.horarios?.length) return '—';
    const dias: Record<string, string> = {
      LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
      JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom'
    };
    return m.horarios
      .map(h => `${dias[h.diaSemana] ?? h.diaSemana} ${h.horaInicio.slice(0,5)}-${h.horaFin.slice(0,5)}`)
      .join(', ');
  }

  irALista()    { this.router.navigate(['/admin/lista']); }
  irACarreras() { this.router.navigate(['/admin/carreras']); }
  irADocentes() { this.router.navigate(['/admin/docentes']); }
  logout()      { this.authService.logout(); this.router.navigate(['/login']); }
}
