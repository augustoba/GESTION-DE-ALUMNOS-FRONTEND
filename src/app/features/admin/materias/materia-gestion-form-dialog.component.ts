import { Component, inject, Inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MateriaResponse, CarreraDetalle, DocenteResponse } from '../../../core/models/api-response.model';

export interface MateriaGestionDialogData {
  materia: MateriaResponse | null;
  carreras: CarreraDetalle[];
  docentes: DocenteResponse[];
}

const DIAS = [
  { value: 'LUNES',     label: 'Lunes' },
  { value: 'MARTES',    label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES',    label: 'Jueves' },
  { value: 'VIERNES',   label: 'Viernes' },
  { value: 'SABADO',    label: 'Sábado' },
  { value: 'DOMINGO',   label: 'Domingo' },
];

@Component({
  selector: 'app-materia-gestion-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.materia ? 'Editar materia' : 'Nueva materia' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Carrera *</mat-label>
            <mat-select formControlName="carreraId" (selectionChange)="onCarreraChange()">
              @for (c of data.carreras; track c.id) {
                <mat-option [value]="c.id">{{ c.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Año *</mat-label>
            <mat-select formControlName="anioCarreraId">
              @for (a of aniosFiltrados(); track a.id) {
                <mat-option [value]="a.id">{{ a.numeroAnio }}° año</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Nombre de la materia *</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Inglés" />
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

        <div class="horarios-section">
          <div class="horarios-header">
            <span class="horarios-title">Horarios</span>
            <button type="button" mat-stroked-button color="primary" (click)="agregarHorario()">
              <mat-icon>add</mat-icon> Agregar día
            </button>
          </div>

          <div formArrayName="horarios" class="horarios-list">
            @for (h of horarios.controls; let i = $index; track i) {
              <div [formGroupName]="i" class="horario-row">

                <mat-form-field appearance="outline" class="field-dia">
                  <mat-label>Día</mat-label>
                  <mat-select formControlName="diaSemana">
                    @for (dia of diasSemana; track dia.value) {
                      <mat-option [value]="dia.value">{{ dia.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-hora">
                  <mat-label>Inicio</mat-label>
                  <input matInput type="time" formControlName="horaInicio" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="field-hora">
                  <mat-label>Fin</mat-label>
                  <input matInput type="time" formControlName="horaFin" />
                </mat-form-field>

                <button type="button" mat-icon-button color="warn" (click)="quitarHorario(i)" matTooltip="Quitar horario">
                  <mat-icon>delete_outline</mat-icon>
                </button>

              </div>
            }

            @if (horarios.length === 0) {
              <p class="sin-horarios">Sin horarios definidos. Podés agregarlos ahora o luego.</p>
            }
          </div>
        </div>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        {{ data.materia ? 'Guardar cambios' : 'Crear materia' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 4px; min-width: 480px; padding-top: 8px; }
    mat-form-field { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .horarios-section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 4px; }
    .horarios-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .horarios-title { font-weight: 600; font-size: 0.9rem; color: #475569; }
    .horarios-list { display: flex; flex-direction: column; gap: 8px; }
    .horario-row { display: grid; grid-template-columns: 1fr 110px 110px 44px; gap: 8px; align-items: center; }
    .sin-horarios { color: #94a3b8; font-size: 0.85rem; margin: 4px 0; }
  `]
})
export class MateriaGestionFormDialogComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private dialogRef  = inject(MatDialogRef<MateriaGestionFormDialogComponent>);

  readonly diasSemana = DIAS;

  form = this.fb.group({
    carreraId:     [null as number | null, Validators.required],
    anioCarreraId: [null as number | null, Validators.required],
    nombre:        ['', Validators.required],
    descripcion:   [''],
    docenteId:     [null as number | null],
    horarios:      this.fb.array([])
  });

  get horarios(): FormArray { return this.form.get('horarios') as FormArray; }

  private _selectedCarreraId = signal<number | null>(null);

  aniosFiltrados = computed(() => {
    const carreraId = this._selectedCarreraId();
    if (!carreraId) return [];
    return this.data.carreras.find(c => c.id === carreraId)?.anios ?? [];
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: MateriaGestionDialogData) {}

  ngOnInit() {
    if (this.data.materia) {
      const m = this.data.materia;
      let carreraId: number | null = null;
      for (const c of this.data.carreras) {
        if (c.anios.some(a => a.id === m.anioCarreraId)) {
          carreraId = c.id;
          break;
        }
      }
      this._selectedCarreraId.set(carreraId);
      this.form.patchValue({
        carreraId,
        anioCarreraId: m.anioCarreraId,
        nombre:        m.nombre,
        descripcion:   m.descripcion ?? '',
        docenteId:     m.docente?.id ?? null
      });
      for (const h of m.horarios) {
        this.horarios.push(this.fb.group({
          diaSemana:  [h.diaSemana,  Validators.required],
          horaInicio: [h.horaInicio, Validators.required],
          horaFin:    [h.horaFin,    Validators.required]
        }));
      }
    }
  }

  onCarreraChange() {
    const id = this.form.get('carreraId')?.value ?? null;
    this._selectedCarreraId.set(id);
    this.form.get('anioCarreraId')?.setValue(null);
  }

  agregarHorario() {
    this.horarios.push(this.fb.group({
      diaSemana:  ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin:    ['', Validators.required]
    }));
  }

  quitarHorario(i: number) { this.horarios.removeAt(i); }

  guardar() {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.dialogRef.close({
      nombre:        v.nombre,
      descripcion:   v.descripcion || null,
      anioCarreraId: v.anioCarreraId!,
      docenteId:     v.docenteId || null,
      horarios:      (v.horarios as any[]).map(h => ({
        diaSemana:  h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin:    h.horaFin
      }))
    });
  }
}
