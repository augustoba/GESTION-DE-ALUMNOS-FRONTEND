import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import {
  PreinscripcionDetalle, DocumentoResumen, EstadoDocumento, EstadoPreinscripcion
} from '../../../core/models/api-response.model';

const OBLIGATORIOS = ['DNI_FRENTE', 'DNI_DORSO', 'TITULO', 'FOTO_CARNET'];

@Component({
  selector: 'app-admin-revision',
  imports: [
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
    MatCardModule, MatDividerModule, MatProgressSpinnerModule, MatButtonToggleModule, DatePipe
  ],
  templateUrl: './admin-revision.component.html',
  styleUrl: './admin-revision.component.scss'
})
export class AdminRevisionComponent implements OnInit, OnDestroy {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);

  preinscripcion = signal<PreinscripcionDetalle | null>(null);
  loading        = signal(true);
  guardando      = signal(false);
  decisiones     = signal<Record<number, EstadoDocumento>>({});
  fotoUrl        = signal<string | null>(null);

  private _fotoObjectUrl: string | null = null;

  docsObligatorios = computed(() =>
    (this.preinscripcion()?.documentos ?? []).filter(d => OBLIGATORIOS.includes(d.tipo))
  );

  docsOtros = computed(() =>
    (this.preinscripcion()?.documentos ?? []).filter(d => !OBLIGATORIOS.includes(d.tipo))
  );

  // todos los documentos deben tener decisión antes de confirmar
  todasDecididas = computed(() => {
    const todos = [...this.docsObligatorios(), ...this.docsOtros()];
    return todos.length > 0 && todos.every(d => this.decisiones()[d.id] != null);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adminService.getDetalle(id).subscribe({
      next: res => {
        this.preinscripcion.set(res.data);

        // pre-cargar decisiones para docs que ya tienen estado
        const init: Record<number, EstadoDocumento> = {};
        res.data.documentos.forEach(d => {
          if (d.estado !== 'PENDIENTE') init[d.id] = d.estado;
        });
        this.decisiones.set(init);

        // cargar foto carnet para mostrar en el card del alumno
        const fotoDoc = res.data.documentos.find(d => d.tipo === 'FOTO_CARNET');
        if (fotoDoc) {
          this.adminService.getDocumentoBlob(fotoDoc.id).subscribe(blob => {
            this._fotoObjectUrl = URL.createObjectURL(blob);
            this.fotoUrl.set(this._fotoObjectUrl);
          });
        }
      },
      complete: () => this.loading.set(false),
      error:    () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    if (this._fotoObjectUrl) URL.revokeObjectURL(this._fotoObjectUrl);
  }

  getDecision(docId: number): EstadoDocumento | null {
    return this.decisiones()[docId] ?? null;
  }

  setDecision(docId: number, estado: EstadoDocumento): void {
    this.decisiones.update(d => ({ ...d, [docId]: estado }));
  }

  verDocumento(doc: DocumentoResumen): void {
    this.adminService.getDocumentoBlob(doc.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  labelTipo(tipo: string): string {
    const map: Record<string, string> = {
      DNI_FRENTE:       'DNI Frente',
      DNI_DORSO:        'DNI Dorso',
      TITULO:           'Título Secundario',
      FOTO_CARNET:      'Foto Carnet',
      COMPROBANTE_PAGO: 'Comprobante de Pago'
    };
    return map[tipo] ?? tipo;
  }

  estadoLabelDoc(estado: EstadoDocumento): string {
    const m: Record<EstadoDocumento, string> = {
      PENDIENTE: 'Pendiente',
      VALIDADO:  'Validado',
      RESUBIR:   'Resubir'
    };
    return m[estado];
  }

  confirmar(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        titulo: '¿Confirmar revisión?',
        mensaje: 'Se guardarán los estados de todos los documentos y se enviará un email al alumno con el resultado de la revisión.',
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.guardando.set(true);
      const id = this.preinscripcion()!.id;

      // incluir TODOS los documentos en la revisión
      const decisiones = [
        ...this.docsObligatorios(),
        ...this.docsOtros()
      ].map(d => ({
        documentoId: d.id,
        estado: this.decisiones()[d.id] as EstadoDocumento
      }));

      this.adminService.confirmarRevision(id, { decisiones }).subscribe({
        next: res => {
          const aprobada = (res.data as { estado: EstadoPreinscripcion }).estado === 'APROBADA';
          this.snackBar.open(
            aprobada
              ? 'Inscripción aprobada. Email enviado al alumno.'
              : 'Revisión guardada. El alumno debe corregir los documentos indicados.',
            'Cerrar',
            { duration: 5000 }
          );
          this.router.navigate(['/admin/lista']);
        },
        error: () => {
          this.snackBar.open('Error al guardar la revisión. Intente nuevamente.', 'Cerrar', { duration: 4000 });
          this.guardando.set(false);
        }
      });
    });
  }

  volver():     void { this.router.navigate(['/admin/lista']); }
  irACarreras():void { this.router.navigate(['/admin/carreras']); }
  irADocentes():void { this.router.navigate(['/admin/docentes']); }
  logout():     void { this.authService.logout(); }
}
