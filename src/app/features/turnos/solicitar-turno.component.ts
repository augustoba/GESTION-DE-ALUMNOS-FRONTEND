import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ApiResponse } from '../../core/models/api-response.model';
import { ConfiguracionService } from '../../core/services/configuracion.service';

interface DiaInscripcion {
  id: number;
  nombre: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
  cupoMaximo: number;
  cupoOcupado: number;
  cupoDisponible: number;
}

interface TurnoResponse {
  id: number;
  numeroTurno: string;
  horaAsignada: string;
  fechaTurno: string;
  confirmado: boolean;
  carreraNombre: string | null;
}

interface PreinscripcionResumen {
  id: number;
  codigoFormulario: string;
  nombre: string;
  apellido: string;
  carreraNombre: string | null;
}

type Paso = 'form' | 'seleccionando' | 'turno';

@Component({
  selector: 'app-solicitar-turno',
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './solicitar-turno.component.html',
  styleUrl: './solicitar-turno.component.scss'
})
export class SolicitarTurnoComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private http           = inject(HttpClient);
  private configuracion  = inject(ConfiguracionService);

  turnosCerrados = signal(false);
  dias           = signal<DiaInscripcion[]>([]);
  loadingDias    = signal(true);
  buscando       = signal(false);
  asignando      = signal(false);
  error          = signal('');
  paso           = signal<Paso>('form');
  candidatos     = signal<PreinscripcionResumen[]>([]);
  turnoObtenido  = signal<TurnoResponse | null>(null);

  form = this.fb.group({
    configuracionTurnoId: [null as number | null, Validators.required],
    tipoBusqueda:         ['DNI', Validators.required],
    valor:                [''],
    nombre:               [''],
    apellido:             ['']
  });

  ngOnInit(): void {
    this.configuracion.getTurnosHabilitados().subscribe({
      next: habilitados => {
        if (!habilitados) {
          this.turnosCerrados.set(true);
          this.loadingDias.set(false);
          return;
        }
        this.http.get<ApiResponse<DiaInscripcion[]>>('/api/turnos/dias-disponibles').subscribe({
          next: res => this.dias.set(res.data),
          complete: () => this.loadingDias.set(false),
          error: () => this.loadingDias.set(false)
        });
      },
      error: () => this.loadingDias.set(false)
    });
  }

  get tipoBusqueda(): string {
    return this.form.get('tipoBusqueda')?.value ?? 'DNI';
  }

  onBuscar(): void {
    const v = this.form.getRawValue();
    if (!v.configuracionTurnoId) { this.error.set('Seleccioná un día de inscripción.'); return; }

    if (v.tipoBusqueda === 'NOMBRE' && (!v.nombre?.trim() || !v.apellido?.trim())) {
      this.error.set('Ingresá nombre y apellido.'); return;
    }
    if (v.tipoBusqueda !== 'NOMBRE' && !v.valor?.trim()) {
      this.error.set('Ingresá el valor de búsqueda.'); return;
    }

    this.buscando.set(true);
    this.error.set('');

    this.http.post<ApiResponse<PreinscripcionResumen[]>>('/api/turnos/buscar', {
      tipoBusqueda: v.tipoBusqueda,
      valor:    v.valor,
      nombre:   v.nombre,
      apellido: v.apellido
    }).subscribe({
      next: res => {
        const lista = res.data ?? [];
        if (lista.length === 1) {
          this.asignarTurno(lista[0].id);
        } else {
          this.candidatos.set(lista);
          this.paso.set('seleccionando');
          this.buscando.set(false);
        }
      },
      error: err => {
        this.error.set(err.error?.mensaje || 'No se encontraron coincidencias con los datos ingresados.');
        this.buscando.set(false);
      }
    });
  }

  seleccionar(candidato: PreinscripcionResumen): void {
    this.asignarTurno(candidato.id);
  }

  private asignarTurno(preinscripcionId: number): void {
    const v = this.form.getRawValue();
    this.asignando.set(true);
    this.error.set('');

    this.http.post<ApiResponse<TurnoResponse>>('/api/turnos/solicitar', {
      configuracionTurnoId: v.configuracionTurnoId,
      preinscripcionId,
      tipoBusqueda: v.tipoBusqueda,
      valor: v.valor,
      nombre: v.nombre,
      apellido: v.apellido
    }).subscribe({
      next: res => {
        this.turnoObtenido.set(res.data);
        this.paso.set('turno');
      },
      error: err => {
        this.error.set(err.error?.mensaje || 'No se pudo obtener el turno. Verificá tus datos.');
        this.paso.set('form');
      },
      complete: () => {
        this.buscando.set(false);
        this.asignando.set(false);
      }
    });
  }

  volverAlForm(): void {
    this.paso.set('form');
    this.candidatos.set([]);
    this.error.set('');
  }

  diaLabel(dia: DiaInscripcion): string {
    const fecha = new Date(dia.fecha + 'T12:00:00');
    return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
