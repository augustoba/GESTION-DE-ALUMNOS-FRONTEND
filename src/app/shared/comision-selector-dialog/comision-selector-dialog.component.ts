import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AnioCarreraResponse, ComisionResponse } from '../../core/models/api-response.model';

export interface ComisionSelectorData {
  carreraNombre: string;
  anios: AnioCarreraResponse[];
}

@Component({
  selector: 'app-comision-selector-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatListModule, MatIconModule, MatChipsModule, MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>Seleccionar comisión</h2>
    <mat-dialog-content>
      <p class="carrera-label"><mat-icon>school</mat-icon> {{ data.carreraNombre }}</p>

      @for (anio of data.anios; track anio.id) {
        @if (anio.comisiones.length) {
          <div class="anio-section">
            <p class="anio-header">{{ anio.numeroAnio }}° Año</p>
            <mat-divider />
            <mat-action-list>
              @for (com of anio.comisiones; track com.id) {
                <button mat-list-item (click)="seleccionar(com)"
                  [class.sin-cupo]="com.cupoMaximo > 0 && com.alumnosCount >= com.cupoMaximo">
                  <mat-icon matListItemIcon>group</mat-icon>
                  <span matListItemTitle>Comisión {{ com.nombre }}</span>
                  <span matListItemLine class="cupo-info">
                    {{ com.alumnosCount }} / {{ com.cupoMaximo > 0 ? com.cupoMaximo : '∞' }} alumnos
                    @if (com.cupoMaximo > 0 && com.alumnosCount >= com.cupoMaximo) {
                      <span class="chip-lleno">Sin cupo</span>
                    }
                  </span>
                </button>
              }
            </mat-action-list>
          </div>
        }
      }

      @if (!tieneComisiones()) {
        <div class="sin-comisiones">
          <mat-icon>warning</mat-icon>
          <p>Esta carrera no tiene comisiones configuradas. Creá comisiones desde la gestión de carreras.</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .carrera-label { display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--color-primary, #1e40af); margin: 0 0 12px; }
    .anio-section { margin-bottom: 16px; }
    .anio-header { font-weight: 600; font-size: 0.9rem; color: #64748b; margin: 12px 0 4px; }
    .cupo-info { font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 8px; }
    .chip-lleno { background: #fee2e2; color: #dc2626; border-radius: 12px; padding: 2px 8px; font-size: 0.75rem; }
    .sin-cupo { opacity: 0.5; cursor: not-allowed; }
    .sin-comisiones { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; color: #94a3b8; text-align: center; }
    .sin-comisiones mat-icon { font-size: 48px; height: 48px; width: 48px; }
  `]
})
export class ComisionSelectorDialogComponent {
  private dialogRef = inject(MatDialogRef<ComisionSelectorDialogComponent>);
  data: ComisionSelectorData = inject(MAT_DIALOG_DATA);

  tieneComisiones(): boolean {
    return this.data.anios.some(a => a.comisiones?.length > 0);
  }

  seleccionar(com: ComisionResponse): void {
    if (com.cupoMaximo > 0 && com.alumnosCount >= com.cupoMaximo) return;
    this.dialogRef.close(com.id);
  }
}
