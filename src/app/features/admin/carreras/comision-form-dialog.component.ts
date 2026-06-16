import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ComisionResponse } from '../../../core/models/api-response.model';
import { ComisionRequest } from '../../../core/services/admin.service';

export interface ComisionFormData {
  comision: ComisionResponse | null;
}

@Component({
  selector: 'app-comision-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.comision ? 'Editar' : 'Nueva' }} comisión</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="comision-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre de la comisión</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: A, B, Mañana, Tarde" />
          <mat-hint>Identificador de la sección (A, B, Turno mañana, etc.)</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cupo máximo</mat-label>
          <input matInput type="number" formControlName="cupoMaximo" min="0" />
          <mat-hint>0 = sin límite de cupo</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Prefijo de turno</mat-label>
          <input matInput formControlName="prefijoTurno" maxlength="5" placeholder="Ej: A, B" />
          <mat-hint>Letra/s que identifican el turno (máx. 5 caracteres)</mat-hint>
        </mat-form-field>

        <mat-slide-toggle formControlName="activa" color="primary">
          Comisión activa
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        {{ data.comision ? 'Actualizar' : 'Agregar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .comision-form { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; min-width: 340px; }
    .full-width { width: 100%; }
  `]
})
export class ComisionFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ComisionFormDialogComponent>);
  data: ComisionFormData = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    cupoMaximo: [0, [Validators.required, Validators.min(0)]],
    prefijoTurno: ['', Validators.maxLength(5)],
    activa: [true]
  });

  ngOnInit() {
    if (this.data.comision) {
      this.form.patchValue({
        nombre: this.data.comision.nombre,
        cupoMaximo: this.data.comision.cupoMaximo,
        prefijoTurno: this.data.comision.prefijoTurno ?? '',
        activa: this.data.comision.activa
      });
    }
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    const req: ComisionRequest = {
      nombre: v.nombre!,
      cupoMaximo: v.cupoMaximo ?? 0,
      prefijoTurno: v.prefijoTurno || null,
      activa: v.activa ?? true
    };
    this.dialogRef.close(req);
  }
}
