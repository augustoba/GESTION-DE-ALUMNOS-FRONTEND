import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { ComisionSelectorDialogComponent } from '../../../shared/comision-selector-dialog/comision-selector-dialog.component';
import { PreinscripcionDetalle, TipoDocumento } from '../../../core/models/api-response.model';

const TIPOS_DOC: { tipo: TipoDocumento; label: string }[] = [
  { tipo: 'DNI_FRENTE',      label: 'DNI Frente' },
  { tipo: 'DNI_DORSO',       label: 'DNI Dorso' },
  { tipo: 'TITULO',          label: 'Título Secundario' },
  { tipo: 'ACTA_NACIMIENTO', label: 'Acta de Nacimiento' },
  { tipo: 'PSICOFISICO',     label: 'Psicofísico' },
  { tipo: 'BUENA_CONDUCTA',  label: 'Certificado de Buena Conducta' },
  { tipo: 'FOTO_CARNET',     label: 'Foto Carnet' },
];

@Component({
  selector: 'app-admin-revision',
  imports: [
    ReactiveFormsModule, DatePipe, CurrencyPipe,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
    MatCardModule, MatDividerModule, MatProgressSpinnerModule, MatCheckboxModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatTooltipModule
  ],
  templateUrl: './admin-revision.component.html',
  styleUrl: './admin-revision.component.scss'
})
export class AdminRevisionComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  private fb           = inject(FormBuilder);
  protected themeService = inject(ThemeService);

  preinscripcion  = signal<PreinscripcionDetalle | null>(null);
  loading         = signal(true);
  accionando      = signal(false);
  registrandoPago = signal(false);
  toggleandoDoc   = signal<TipoDocumento | null>(null);

  readonly tiposDoc = TIPOS_DOC;

  pagoForm = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  get preId(): number { return Number(this.route.snapshot.paramMap.get('id')); }

  ngOnInit(): void {
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    this.loading.set(true);
    this.adminService.getDetalle(this.preId).subscribe({
      next: res => this.preinscripcion.set(res.data),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  estaPresente(tipo: TipoDocumento): boolean {
    return this.preinscripcion()?.checklist.some(c => c.tipoDocumento === tipo && c.presentado) ?? false;
  }

  toggleDoc(tipo: TipoDocumento): void {
    if (this.toggleandoDoc()) return;
    this.toggleandoDoc.set(tipo);
    const presente = this.estaPresente(tipo);
    const obs$: Observable<unknown> = presente
      ? this.adminService.desmarcarDocumento(this.preId, tipo)
      : this.adminService.marcarDocumento(this.preId, tipo);
    obs$.subscribe({
      next: () => { this.toggleandoDoc.set(null); this.cargarDetalle(); },
      error: () => {
        this.snackBar.open('Error al actualizar documento.', 'Cerrar', { duration: 3000 });
        this.toggleandoDoc.set(null);
      }
    });
  }

  registrarPago(): void {
    if (this.pagoForm.invalid) { this.pagoForm.markAllAsTouched(); return; }
    this.registrandoPago.set(true);
    const monto = this.pagoForm.value.monto!;
    this.adminService.registrarPago(this.preId, { montoAbonado: monto }).subscribe({
      next: () => {
        this.snackBar.open('Pago registrado.', 'Cerrar', { duration: 3000 });
        this.pagoForm.reset();
        this.cargarDetalle();
      },
      error: () => {
        this.snackBar.open('Error al registrar pago.', 'Cerrar', { duration: 3000 });
        this.registrandoPago.set(false);
      },
      complete: () => this.registrandoPago.set(false)
    });
  }

  pasarARevision(): void {
    this.accionando.set(true);
    this.adminService.enRevision(this.preId).subscribe({
      next: res => {
        this.preinscripcion.update(p => p ? { ...p, estado: res.data.estado } : p);
        this.snackBar.open('Estado actualizado a En Revisión.', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Error al actualizar estado.', 'Cerrar', { duration: 3000 });
        this.accionando.set(false);
      },
      complete: () => this.accionando.set(false)
    });
  }

  habilitar(): void {
    const pre = this.preinscripcion();
    if (!pre?.carreraId) {
      this.snackBar.open('Esta preinscripción no tiene carrera asignada.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.accionando.set(true);
    this.adminService.getCarreraDetalle(pre.carreraId).subscribe({
      next: res => {
        this.accionando.set(false);
        const ref = this.dialog.open(ComisionSelectorDialogComponent, {
          width: '480px',
          data: { carreraNombre: res.data.nombre, anios: res.data.anios }
        });
        ref.afterClosed().subscribe((comisionId: number | undefined) => {
          if (!comisionId) return;
          this.accionando.set(true);
          this.adminService.habilitar(this.preId, comisionId).subscribe({
            next: () => {
              this.snackBar.open('Alumno habilitado correctamente.', 'Cerrar', { duration: 5000 });
              this.router.navigate(['/admin/lista']);
            },
            error: err => {
              this.snackBar.open(err.error?.mensaje ?? 'Error al habilitar.', 'Cerrar', { duration: 4000 });
              this.accionando.set(false);
            }
          });
        });
      },
      error: () => {
        this.accionando.set(false);
        this.snackBar.open('Error al cargar comisiones de la carrera.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  rechazar(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        titulo: '¿Rechazar preinscripción?',
        mensaje: 'La preinscripción quedará marcada como rechazada.',
        confirmLabel: 'Rechazar',
        cancelLabel: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.accionando.set(true);
      this.adminService.rechazar(this.preId).subscribe({
        next: () => {
          this.snackBar.open('Preinscripción rechazada.', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/admin/lista']);
        },
        error: () => {
          this.snackBar.open('Error al rechazar.', 'Cerrar', { duration: 4000 });
          this.accionando.set(false);
        }
      });
    });
  }

  estadoLabel(e: string): string {
    const m: Record<string, string> = {
      PENDIENTE: 'Pendiente', EN_REVISION: 'En revisión',
      HABILITADO: 'Habilitado', RECHAZADO: 'Rechazado'
    };
    return m[e] ?? e;
  }

  pagoLabel(e: string): string {
    const m: Record<string, string> = {
      SIN_PAGO: 'Sin pago', PARCIAL: 'Parcial', COMPLETO: 'Completo'
    };
    return m[e] ?? e;
  }

  volver():      void { this.router.navigate(['/admin/lista']); }
  irACarreras(): void { this.router.navigate(['/admin/carreras']); }
  irADocentes(): void { this.router.navigate(['/admin/docentes']); }
  logout():      void { this.authService.logout(); }
}
