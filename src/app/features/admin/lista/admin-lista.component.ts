import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Preinscripcion, EstadoPreinscripcion } from '../../../core/models/api-response.model';

type Filtro = 'todas' | 'pendientes' | 'rechazados' | 'faltantes';

@Component({
  selector: 'app-admin-lista',
  imports: [
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule,
    MatButtonModule, MatTableModule, MatButtonToggleModule,
    MatProgressSpinnerModule, MatDividerModule, DatePipe
  ],
  templateUrl: './admin-lista.component.html',
  styleUrl: './admin-lista.component.scss'
})
export class AdminListaComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private router       = inject(Router);

  filtro            = signal<Filtro>('todas');
  preinscripciones  = signal<Preinscripcion[]>([]);
  loading           = signal(false);

  readonly displayedColumns = ['nombre', 'dni', 'carrera', 'estado', 'fecha', 'acciones'];

  ngOnInit(): void {
    this.cargar('todas');
  }

  setFiltro(f: Filtro): void {
    this.filtro.set(f);
    this.cargar(f);
  }

  cargar(f: Filtro): void {
    this.loading.set(true);

    if (f === 'todas') {
      this.adminService.getPreinscripciones(0, 50).subscribe({
        next: res => this.preinscripciones.set(res.data.content),
        complete: () => this.loading.set(false),
        error: () => this.loading.set(false)
      });
      return;
    }

    const obs$ = f === 'pendientes'
      ? this.adminService.getConDocumentosPendientes()
      : f === 'rechazados'
        ? this.adminService.getConDocumentosRechazados()
        : this.adminService.getConDocumentosFaltantes();

    obs$.subscribe({
      next: res => this.preinscripciones.set(res.data),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  revisar(id: number): void {
    this.router.navigate(['/admin/revision', id]);
  }

  estadoLabel(e: EstadoPreinscripcion): string {
    const m: Record<EstadoPreinscripcion, string> = {
      PENDIENTE_PAGO:       'Pend. pago',
      PAGO_VALIDADO:        'Pago validado',
      DOCUMENTOS_COMPLETOS: 'Docs completos',
      APROBADA:             'Aprobada',
      EXPIRADA:             'Expirada'
    };
    return m[e] ?? e;
  }

  estadoClass(e: EstadoPreinscripcion): string {
    const m: Record<EstadoPreinscripcion, string> = {
      PENDIENTE_PAGO:       'chip-warn',
      PAGO_VALIDADO:        'chip-info',
      DOCUMENTOS_COMPLETOS: 'chip-primary',
      APROBADA:             'chip-success',
      EXPIRADA:             'chip-muted'
    };
    return m[e] ?? '';
  }

  irACarreras(): void { this.router.navigate(['/admin/carreras']); }
  irADocentes(): void { this.router.navigate(['/admin/docentes']); }

  logout(): void {
    this.authService.logout();
  }
}
