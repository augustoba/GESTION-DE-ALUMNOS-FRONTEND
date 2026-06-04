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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin } from 'rxjs';
import { PreinscripcionService } from '../../../core/services/preinscripcion.service';
import { AuthService } from '../../../core/services/auth.service';
import { Carrera } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-preinscripcion-form',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './preinscripcion-form.component.html',
  styleUrl: './preinscripcion-form.component.scss'
})
export class PreinscripcionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private preinscripcionService = inject(PreinscripcionService);
  private authService = inject(AuthService);

  loading = signal(false);
  loadingDatos = signal(true);
  error = signal('');
  success = signal(false);
  numeroFormulario = signal<number | null>(null);

  carreras = signal<Carrera[]>([]);
  username = this.authService.getUsername();

  form = this.fb.group({
    // Datos del registro (bloqueados)
    nombres:          [{ value: '', disabled: true }, Validators.required],
    apellidos:        [{ value: '', disabled: true }, Validators.required],
    dni:              [{ value: '', disabled: true }, Validators.required],
    email:            [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    // Datos personales adicionales
    fechaNacimiento:  ['', Validators.required],
    lugarNacimiento:  [''],
    nacionalidad:     [''],
    domicilio:        [''],
    localidad:        [''],
    telefono:         [''],
    // Carrera
    carreraId:        [null as number | null],
    // Datos educativos
    egresadoDe:       [''],
    tituloDe:         [''],
    debeMaterias:     [false],
    materiasAdeudadas:[''],
    // Salud
    afeccionEspecifica: [''],
    grupoSanguineo:   ['']
  });

  get debeMateriasValue(): boolean {
    return !!this.form.get('debeMaterias')?.value;
  }

  ngOnInit(): void {
    forkJoin({
      perfil:   this.preinscripcionService.getPerfil(),
      carreras: this.preinscripcionService.getCarreras()
    }).subscribe({
      next: ({ perfil, carreras }) => {
        const p = perfil.data;
        this.form.patchValue({
          nombres:         p.nombres,
          apellidos:       p.apellidos,
          dni:             p.dni,
          email:           p.email,
          domicilio:       p.direccion ?? '',
          fechaNacimiento: p.fechaNac  ?? '',
          telefono:        p.telefono  ?? ''
        });
        this.carreras.set(carreras.data);
      },
      error: () => this.error.set('No se pudo cargar tu información. Recargá la página.'),
      complete: () => this.loadingDatos.set(false)
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
      nombres:           v.nombres!,
      apellidos:         v.apellidos!,
      dni:               v.dni!,
      fechaNacimiento:   v.fechaNacimiento!,
      lugarNacimiento:   v.lugarNacimiento ?? '',
      nacionalidad:      v.nacionalidad    ?? '',
      domicilio:         v.domicilio       ?? '',
      localidad:         v.localidad       ?? '',
      telefono:          v.telefono        ?? '',
      email:             v.email!,
      egresadoDe:        v.egresadoDe      ?? '',
      tituloDe:          v.tituloDe        ?? '',
      debeMaterias:      !!v.debeMaterias,
      materiasAdeudadas: v.debeMaterias ? (v.materiasAdeudadas ?? null) : null,
      afeccionEspecifica: v.afeccionEspecifica || null,
      grupoSanguineo:    v.grupoSanguineo  ?? '',
      carreraId:         v.carreraId
    }).subscribe({
      next: res => {
        const id = (res.data as { id: number })?.id;
        this.numeroFormulario.set(id ?? null);
        this.success.set(true);
      },
      error: err => {
        this.error.set(err.error?.mensaje || 'Error al enviar. Intentá de nuevo.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  logout(): void { this.authService.logout(); }
}
