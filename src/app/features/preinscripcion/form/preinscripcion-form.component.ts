import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { PreinscripcionService } from '../../../core/services/preinscripcion.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { Carrera } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-preinscripcion-form',
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule
  ],
  templateUrl: './preinscripcion-form.component.html',
  styleUrl: './preinscripcion-form.component.scss'
})
export class PreinscripcionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private preinscripcionService = inject(PreinscripcionService);
  private configuracionService = inject(ConfiguracionService);

  loading              = signal(false);
  loadingCarreras      = signal(true);
  error                = signal('');
  success              = signal(false);
  codigoFormulario     = signal<string | null>(null);
  preinscripcionCerrada = signal(false);

  carreras = signal<Carrera[]>([]);

  form = this.fb.group({
    nombre:          ['', Validators.required],
    apellido:        ['', Validators.required],
    dni:             ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    fechaNacimiento: ['', Validators.required],
    lugarNacimiento: ['', Validators.required],
    nacionalidad:    ['', Validators.required],
    direccion:       ['', Validators.required],
    localidad:       ['', Validators.required],
    telefono:        ['', Validators.required],
    carreraId:       [null as number | null, Validators.required]
  });

  ngOnInit(): void {
    this.form.get('carreraId')?.disable();

    this.configuracionService.getPreinscripcionHabilitada().subscribe({
      next: habilitada => { if (!habilitada) this.preinscripcionCerrada.set(true); },
      error: () => {}
    });

    this.preinscripcionService.getCarreras().subscribe({
      next: res => this.carreras.set(res.data),
      error: () => {
        this.loadingCarreras.set(false);
        this.form.get('carreraId')?.enable();
      },
      complete: () => {
        this.loadingCarreras.set(false);
        this.form.get('carreraId')?.enable();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const v = this.form.getRawValue();

    this.preinscripcionService.crear({
      nombre:          v.nombre!,
      apellido:        v.apellido!,
      dni:             v.dni!,
      email:           v.email!,
      fechaNacimiento: v.fechaNacimiento || null,
      lugarNacimiento: v.lugarNacimiento || null,
      nacionalidad:    v.nacionalidad    || null,
      direccion:       v.direccion       || null,
      localidad:       v.localidad       || null,
      telefono:        v.telefono        || null,
      fotoUrl:         null,
      carreraId:       v.carreraId
    }).subscribe({
      next: res => {
        const codigo = (res.data as { codigoFormulario?: string })?.codigoFormulario ?? null;
        this.codigoFormulario.set(codigo);
        this.success.set(true);
      },
      error: err => {
        this.error.set(err.error?.mensaje || 'Error al enviar. Intentá de nuevo.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
