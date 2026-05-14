import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { DocenteResumen } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-materia-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.materia ? 'Editar materia' : 'Nueva materia' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">

        <mat-form-field appearance="outline">
          <mat-label>Nombre *</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Docente a cargo</mat-label>
          <mat-select formControlName="docenteId">
            <mat-option [value]="null">Sin asignar</mat-option>
            @for (d of data.docentes; track d.id) {
              <mat-option [value]="d.id">{{ d.nombres }} {{ d.apellidos }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Día</mat-label>
            <mat-select formControlName="diaSemana">
              <mat-option value="">—</mat-option>
              <mat-option value="LUNES">Lunes</mat-option>
              <mat-option value="MARTES">Martes</mat-option>
              <mat-option value="MIERCOLES">Miércoles</mat-option>
              <mat-option value="JUEVES">Jueves</mat-option>
              <mat-option value="VIERNES">Viernes</mat-option>
              <mat-option value="SABADO">Sábado</mat-option>
              <mat-option value="DOMINGO">Domingo</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Hora inicio</mat-label>
            <input matInput type="time" formControlName="horaInicio" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Hora fin</mat-label>
            <input matInput type="time" formControlName="horaFin" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Aula</mat-label>
          <input matInput formControlName="aula" placeholder="Ej: 12, Lab. A" />
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        {{ data.materia ? 'Guardar cambios' : 'Agregar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 4px; min-width: 420px; padding-top: 8px; }
    mat-form-field { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  `]
})
export class MateriaFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<MateriaFormDialogComponent>);

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    docenteId: [null as number | null],
    diaSemana: [''],
    horaInicio: [''],
    horaFin: [''],
    aula: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { materia: any; docentes: DocenteResumen[] }) {}

  ngOnInit() {
    if (this.data.materia) {
      const m = this.data.materia;
      this.form.patchValue({
        nombre: m.nombre,
        descripcion: m.descripcion ?? '',
        docenteId: m.docente?.id ?? null,
        diaSemana: m.diaSemana ?? '',
        horaInicio: m.horaInicio ?? '',
        horaFin: m.horaFin ?? '',
        aula: m.aula ?? ''
      });
    }
  }

  guardar() {
    if (this.form.invalid) return;
    const val = this.form.value;
    this.dialogRef.close({
      nombre: val.nombre,
      descripcion: val.descripcion || null,
      docenteId: val.docenteId || null,
      diaSemana: val.diaSemana || null,
      horaInicio: val.horaInicio || null,
      horaFin: val.horaFin || null,
      aula: val.aula || null
    });
  }
}
