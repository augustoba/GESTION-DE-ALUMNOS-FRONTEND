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

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocenteResponse, MateriaDetalleDocente } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-docente-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatCardModule, MatProgressSpinnerModule, MatDividerModule,
    MatListModule, MatTooltipModule, MatSnackBarModule
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

  docente  = signal<DocenteResponse | null>(null);
  materias = signal<MateriaDetalleDocente[]>([]);
  loading  = signal(true);

  // agrupar materias por carrera para mejor presentación
  materiasPorCarrera = computed(() => {
    const grupos = new Map<string, MateriaDetalleDocente[]>();
    for (const m of this.materias()) {
      const key = m.carreraNombre ?? 'Sin carrera asignada';
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(m);
    }
    return Array.from(grupos.entries()).map(([carrera, items]) => ({ carrera, items }));
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adminService.getDocentesTodos().subscribe({
      next: res => {
        const docente = res.data.find(d => d.id === id) ?? null;
        this.docente.set(docente);
      }
    });
    this.adminService.getDocenteMaterias(id).subscribe({
      next: res => { this.materias.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  diaSemanaLabel(dia: string | null): string {
    const dias: Record<string, string> = {
      LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
      JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo'
    };
    return dia ? (dias[dia] ?? dia) : '';
  }

  volver()      { this.router.navigate(['/admin/docentes']); }
  irALista()    { this.router.navigate(['/admin/lista']); }
  irACarreras() { this.router.navigate(['/admin/carreras']); }
  logout()      { this.authService.logout(); this.router.navigate(['/login']); }
}
