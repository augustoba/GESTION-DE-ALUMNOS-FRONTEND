import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocenteResponse, MateriaDetalleDocente, MateriaResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-docente-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatCardModule, MatProgressSpinnerModule, MatDividerModule,
    MatListModule, MatTooltipModule, MatSnackBarModule,
    MatSelectModule, MatChipsModule, MatFormFieldModule
  ],
  templateUrl: './admin-docente-detalle.component.html',
  styleUrl: './admin-docente-detalle.component.scss'
})
export class AdminDocenteDetalleComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private snackBar     = inject(MatSnackBar);

  private docenteId = 0;

  docente       = signal<DocenteResponse | null>(null);
  materias      = signal<MateriaDetalleDocente[]>([]);
  todasMaterias = signal<MateriaResponse[]>([]);
  loading       = signal(true);
  mostrarSelector = signal(false);

  materiasPorCarrera = computed(() => {
    const grupos = new Map<string, MateriaDetalleDocente[]>();
    for (const m of this.materias()) {
      const key = m.carreraNombre ?? 'Sin carrera asignada';
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(m);
    }
    return Array.from(grupos.entries()).map(([carrera, items]) => ({ carrera, items }));
  });

  materiasSinAsignar = computed(() => {
    const asignadas = new Set(this.materias().map(m => m.id));
    return this.todasMaterias().filter(m => !asignadas.has(m.id));
  });

  ngOnInit() {
    this.docenteId = Number(this.route.snapshot.paramMap.get('id'));
    this.adminService.getDocentesTodos().subscribe({
      next: res => {
        const docente = res.data.find(d => d.id === this.docenteId) ?? null;
        this.docente.set(docente);
      }
    });
    this.adminService.getDocenteMaterias(this.docenteId).subscribe({
      next: res => { this.materias.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.cargarTodasMaterias();
  }

  cargarTodasMaterias() {
    this.adminService.getTodasMaterias().subscribe({
      next: res => this.todasMaterias.set(res.data),
      error: ()  => {}
    });
  }

  asignarMateria(materiaId: number) {
    this.adminService.asignarMateriaADocente(this.docenteId, materiaId).subscribe({
      next: res => {
        this.materias.set(res.data);
        this.mostrarSelector.set(false);
        this.snackBar.open('Materia asignada', 'OK', { duration: 3000 });
      },
      error: err => this.snackBar.open(err?.error?.mensaje || 'Error al asignar', 'OK', { duration: 4000 })
    });
  }

  quitarMateria(materiaId: number) {
    this.adminService.desasignarMateriaDeDocente(this.docenteId, materiaId).subscribe({
      next: res => {
        this.materias.set(res.data);
        this.snackBar.open('Materia quitada', 'OK', { duration: 3000 });
      },
      error: err => this.snackBar.open(err?.error?.mensaje || 'Error al quitar', 'OK', { duration: 4000 })
    });
  }

  toggleSelector() { this.mostrarSelector.update(v => !v); }

  volver()      { this.router.navigate(['/admin/docentes']); }
  irALista()    { this.router.navigate(['/admin/lista']); }
  irACarreras() { this.router.navigate(['/admin/carreras']); }
  logout()      { this.authService.logout(); this.router.navigate(['/login']); }
}
