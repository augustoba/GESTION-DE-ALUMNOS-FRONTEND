import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { DocenteResponse, MateriaResponse } from '../../../core/models/api-response.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-docente-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar docente' : 'Nuevo docente' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Nombres *</mat-label>
            <input matInput formControlName="nombres" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Apellidos *</mat-label>
            <input matInput formControlName="apellidos" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>DNI *</mat-label>
          <input matInput formControlName="dni" maxlength="20" />
          @if (!data) {
            <mat-hint>El DNI será la contraseña inicial de acceso</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email *</mat-label>
          <input matInput formControlName="email" type="email" />
          <mat-hint>Se usará como usuario de acceso al sistema</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" />
        </mat-form-field>

        @if (!data) {
          <mat-form-field appearance="outline">
            <mat-label>Materias a asignar</mat-label>
            @if (loadingMaterias()) {
              <mat-select formControlName="materiasIds" multiple [disabled]="true">
                <mat-option disabled>Cargando...</mat-option>
              </mat-select>
            } @else {
              <mat-select formControlName="materiasIds" multiple>
                @for (m of todasMaterias(); track m.id) {
                  <mat-option [value]="m.id">{{ m.nombre }}{{ m.carreraNombre ? ' — ' + m.carreraNombre : '' }}</mat-option>
                }
              </mat-select>
            }
            <mat-hint>Opcional — se puede asignar después</mat-hint>
          </mat-form-field>
        }

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        {{ data ? 'Guardar cambios' : 'Crear docente' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 6px; min-width: 400px; padding-top: 8px; }
    mat-form-field { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `]
})
export class DocenteFormDialogComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private dialogRef    = inject(MatDialogRef<DocenteFormDialogComponent>);
  private adminService = inject(AdminService);

  todasMaterias  = signal<MateriaResponse[]>([]);
  loadingMaterias = signal(false);

  form = this.fb.group({
    nombres:    ['', Validators.required],
    apellidos:  ['', Validators.required],
    dni:        ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    telefono:   [''],
    materiasIds: [[]] as [number[]]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: DocenteResponse | null) {}

  ngOnInit() {
    if (this.data) {
      this.form.patchValue({
        nombres:   this.data.nombres,
        apellidos: this.data.apellidos,
        dni:       this.data.dni,
        email:     this.data.email,
        telefono:  this.data.telefono ?? ''
      });
    } else {
      this.loadingMaterias.set(true);
      this.adminService.getTodasMaterias().subscribe({
        next: res => { this.todasMaterias.set(res.data); this.loadingMaterias.set(false); },
        error: ()  => this.loadingMaterias.set(false)
      });
    }
  }

  guardar() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const result: any = {
      nombres:   v.nombres,
      apellidos: v.apellidos,
      dni:       v.dni,
      email:     v.email,
      telefono:  v.telefono ?? ''
    };
    if (!this.data) {
      result.materiasIds = v.materiasIds ?? [];
    }
    this.dialogRef.close(result);
  }
}
