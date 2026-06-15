import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DocentePortalService } from '../../../core/services/docente-portal.service';
import { AuthService } from '../../../core/services/auth.service';
import { MateriaDetalleDocente, AlumnoPortal } from '../../../core/models/api-response.model';

type Vista = 'materias' | 'alumnos';

@Component({
  selector: 'app-docente-portal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatListModule, MatDividerModule, MatProgressSpinnerModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatTooltipModule
  ],
  templateUrl: './docente-portal.component.html',
  styleUrl: './docente-portal.component.scss'
})
export class DocentePortalComponent implements OnInit {
  private portalService = inject(DocentePortalService);
  private authService   = inject(AuthService);
  private router        = inject(Router);

  vista           = signal<Vista>('materias');
  materias        = signal<MateriaDetalleDocente[]>([]);
  alumnos         = signal<AlumnoPortal[]>([]);
  loadingMaterias = signal(false);
  loadingAlumnos  = signal(false);
  busqueda        = signal('');

  username = this.authService.getUsername() ?? 'Docente';

  displayedColumns = ['nombre', 'apellido', 'dni', 'carrera', 'acciones'];

  materiasPorCarrera = computed(() => {
    const map = new Map<string, MateriaDetalleDocente[]>();
    for (const m of this.materias()) {
      const key = m.carreraNombre ?? 'Sin carrera';
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([carrera, items]) => ({ carrera, items }));
  });

  alumnosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    if (!q) return this.alumnos();
    return this.alumnos().filter(a =>
      `${a.nombres} ${a.apellidos}`.toLowerCase().includes(q) ||
      a.dni.includes(q)
    );
  });

  ngOnInit() {
    this.cargarMaterias();
    this.cargarAlumnos();
  }

  cargarMaterias() {
    this.loadingMaterias.set(true);
    this.portalService.getMisMaterias().subscribe({
      next: res => { this.materias.set(res.data); this.loadingMaterias.set(false); },
      error: () => this.loadingMaterias.set(false)
    });
  }

  cargarAlumnos() {
    this.loadingAlumnos.set(true);
    this.portalService.getMisAlumnos().subscribe({
      next: res => { this.alumnos.set(res.data); this.loadingAlumnos.set(false); },
      error: () => this.loadingAlumnos.set(false)
    });
  }

  diaSemanaLabel(dia: string): string {
    const dias: Record<string, string> = {
      LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
      JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo'
    };
    return dias[dia] ?? dia;
  }

  setBusqueda(value: string) { this.busqueda.set(value); }

  verAlumno(id: number) { this.router.navigate(['/docente/alumnos', id]); }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}
