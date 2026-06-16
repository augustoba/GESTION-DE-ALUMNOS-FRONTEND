import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carrera-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar carrera' : 'Nueva carrera' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"></textarea>
        </mat-form-field>
        <mat-slide-toggle formControlName="activa">Carrera activa</mat-slide-toggle>
        <p class="hint-text">Los cupos y prefijos de turno se configuran por comisión dentro de cada año.</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        {{ data ? 'Guardar cambios' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 8px; min-width: 380px; padding-top: 8px; }
    mat-form-field { width: 100%; }
    .hint-text { font-size: 0.8rem; color: #64748b; margin: 4px 0 0; }
  `]
})
export class CarreraFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CarreraFormDialogComponent>);

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    activa: [true]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    if (this.data) {
      this.form.patchValue({
        nombre: this.data.nombre,
        descripcion: this.data.descripcion ?? '',
        activa: this.data.activa ?? true
      });
    }
  }

  guardar() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }
}
