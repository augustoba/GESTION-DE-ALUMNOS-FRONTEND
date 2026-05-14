import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

import { DocentePortalService } from '../../../core/services/docente-portal.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlumnoPortal } from '../../../core/models/api-response.model';

interface RegistroAsistencia {
  fecha: string;
  presente: boolean;
}

@Component({
  selector: 'app-docente-alumno-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatListModule, MatDividerModule, MatProgressSpinnerModule,
    MatCardModule, MatTableModule, MatChipsModule
  ],
  templateUrl: './docente-alumno-detalle.component.html',
  styleUrl: './docente-alumno-detalle.component.scss'
})
export class DocenteAlumnoDetalleComponent implements OnInit {
  private portalService = inject(DocentePortalService);
  private authService   = inject(AuthService);
  private route         = inject(ActivatedRoute);
  private router        = inject(Router);

  alumno  = signal<AlumnoPortal | null>(null);
  loading = signal(false);

  username = this.authService.getUsername() ?? 'Docente';

  readonly asistencias: RegistroAsistencia[] = [
    { fecha: '01/04/2025', presente: true  },
    { fecha: '08/04/2025', presente: true  },
    { fecha: '15/04/2025', presente: false },
    { fecha: '22/04/2025', presente: true  },
    { fecha: '29/04/2025', presente: true  },
    { fecha: '06/05/2025', presente: false },
    { fecha: '13/05/2025', presente: true  },
    { fecha: '20/05/2025', presente: true  },
    { fecha: '27/05/2025', presente: true  },
    { fecha: '03/06/2025', presente: false },
  ];

  presentes   = this.asistencias.filter(a => a.presente).length;
  ausentes    = this.asistencias.filter(a => !a.presente).length;
  porcentaje  = Math.round((this.presentes / this.asistencias.length) * 100);

  asistenciaColumns = ['fecha', 'estado'];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.volver(); return; }
    this.loading.set(true);
    this.portalService.getAlumno(id).subscribe({
      next: res => { this.alumno.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.volver(); }
    });
  }

  volver()  { this.router.navigate(['/docente/portal']); }
  logout()  { this.authService.logout(); this.router.navigate(['/login']); }
}
