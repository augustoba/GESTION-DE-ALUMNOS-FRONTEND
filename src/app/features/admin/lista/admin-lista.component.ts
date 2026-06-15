import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { Preinscripcion, EstadoPreinscripcion, ApiResponse } from '../../../core/models/api-response.model';

interface ConfiguracionTurno {
  id: number;
  nombre: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
  intervaloMinutos: number;
  cupoMaximo: number;
  activo: boolean;
}

type Filtro = 'todas' | EstadoPreinscripcion;
type TipoBusqueda = 'codigo' | 'dni' | 'nombre';

@Component({
  selector: 'app-admin-lista',
  imports: [
    FormsModule, ReactiveFormsModule, DatePipe,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule,
    MatButtonModule, MatTableModule, MatButtonToggleModule,
    MatProgressSpinnerModule, MatDividerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCardModule, MatSlideToggleModule
  ],
  templateUrl: './admin-lista.component.html',
  styleUrl: './admin-lista.component.scss'
})
export class AdminListaComponent implements OnInit {
  private adminService    = inject(AdminService);
  private authService     = inject(AuthService);
  private router          = inject(Router);
  private http            = inject(HttpClient);
  private fb              = inject(FormBuilder);
  private snackBar        = inject(MatSnackBar);
  private dialog          = inject(MatDialog);
  private configuracion   = inject(ConfiguracionService);
  protected themeService  = inject(ThemeService);

  // ── Preinscripciones ──────────────────────────────────────────────
  filtro           = signal<Filtro>('todas');
  preinscripciones = signal<Preinscripcion[]>([]);
  loading          = signal(false);
  busqueda         = signal('');
  tipoBusqueda     = signal<TipoBusqueda>('codigo');
  buscando         = signal(false);
  modoBusqueda     = signal(false);

  readonly displayedColumns = ['codigo', 'nombre', 'dni', 'carrera', 'estado', 'fecha', 'acciones'];

  // ── Configuración de preinscripción ──────────────────────────────
  preinscripcionHabilitada  = signal(true);
  toggleandoPreinscripcion  = signal(false);

  // ── Configuración de turnos ───────────────────────────────────────
  turnosHabilitados    = signal(false);
  toggleandoTurnos     = signal(false);
  diasInscripcion      = signal<ConfiguracionTurno[]>([]);
  loadingDias          = signal(false);
  mostrarFormDia       = signal(false);
  guardandoDia         = signal(false);
  editandoDia          = signal<ConfiguracionTurno | null>(null);

  readonly diasColumns = ['nombre', 'fecha', 'horario', 'cupo', 'acciones'];

  diaForm = this.fb.group({
    nombre:          ['', Validators.required],
    fecha:           ['', Validators.required],
    horarioInicio:   ['', Validators.required],
    horarioFin:      ['', Validators.required],
    cupoMaximo:      [100, [Validators.required, Validators.min(1)]],
    intervaloMinutos:[5,  [Validators.required, Validators.min(1)]]
  });

  get isSuperAdmin(): boolean { return this.authService.getRol() === 'SUPER_ADMIN'; }

  ngOnInit(): void {
    this.cargar('todas');
    this.configuracion.getPreinscripcionHabilitada().subscribe({
      next: v => this.preinscripcionHabilitada.set(v),
      error: () => {}
    });
    this.configuracion.getTurnosHabilitados().subscribe({
      next: v => this.turnosHabilitados.set(v),
      error: () => {}
    });
    this.cargarDias();
  }

  // ── Preinscripciones ──────────────────────────────────────────────

  setFiltro(f: Filtro): void {
    this.filtro.set(f);
    this.modoBusqueda.set(false);
    this.busqueda.set('');
    this.cargar(f);
  }

  cargar(f: Filtro): void {
    this.loading.set(true);
    const obs$ = f === 'todas'
      ? this.adminService.getPreinscripciones(0, 100)
      : this.adminService.listarPorEstado(f as EstadoPreinscripcion, 0, 100);

    obs$.subscribe({
      next: res => this.preinscripciones.set(res.data.content),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  buscar(): void {
    const q = this.busqueda().trim();
    if (!q) { this.limpiarBusqueda(); return; }

    this.buscando.set(true);
    this.modoBusqueda.set(true);
    const tipo = this.tipoBusqueda();

    if (tipo === 'codigo') {
      this.adminService.buscarPorCodigo(q).subscribe({
        next: res => this.preinscripciones.set(res.data ?? []),
        error: () => { this.preinscripciones.set([]); this.buscando.set(false); },
        complete: () => this.buscando.set(false)
      });
    } else if (tipo === 'dni') {
      this.adminService.buscarPorDni(q).subscribe({
        next: res => this.preinscripciones.set([res.data]),
        error: () => { this.preinscripciones.set([]); this.buscando.set(false); },
        complete: () => this.buscando.set(false)
      });
    } else {
      this.adminService.buscarPorNombre(q, q, 0, 50).subscribe({
        next: res => this.preinscripciones.set(res.data.content),
        error: () => { this.preinscripciones.set([]); this.buscando.set(false); },
        complete: () => this.buscando.set(false)
      });
    }
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
    this.modoBusqueda.set(false);
    this.cargar(this.filtro());
  }

  revisar(id: number): void {
    this.router.navigate(['/admin/revision', id]);
  }

  estadoLabel(e: EstadoPreinscripcion): string {
    const m: Record<EstadoPreinscripcion, string> = {
      PENDIENTE:   'Pendiente',
      EN_REVISION: 'En revisión',
      HABILITADO:  'Habilitado',
      RECHAZADO:   'Rechazado'
    };
    return m[e] ?? e;
  }

  estadoClass(e: EstadoPreinscripcion): string {
    const m: Record<EstadoPreinscripcion, string> = {
      PENDIENTE:   'chip-warn',
      EN_REVISION: 'chip-info',
      HABILITADO:  'chip-success',
      RECHAZADO:   'chip-muted'
    };
    return m[e] ?? '';
  }

  // ── Configuración de turnos ───────────────────────────────────────

  togglePreinscripcion(habilitada: boolean): void {
    this.toggleandoPreinscripcion.set(true);
    this.configuracion.setPreinscripcionHabilitada(habilitada).subscribe({
      next: () => {
        this.preinscripcionHabilitada.set(habilitada);
        const msg = habilitada ? 'Preinscripción habilitada' : 'Preinscripción deshabilitada';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      },
      error: err => this.snackBar.open(err.error?.mensaje || 'Error.', 'Cerrar', { duration: 4000 }),
      complete: () => this.toggleandoPreinscripcion.set(false)
    });
  }

  cargarDias(): void {
    this.loadingDias.set(true);
    this.http.get<ApiResponse<ConfiguracionTurno[]>>('/api/turnos/configuracion').subscribe({
      next: res => this.diasInscripcion.set(res.data),
      error: () => this.loadingDias.set(false),
      complete: () => this.loadingDias.set(false)
    });
  }

  habilitarTurnos(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        titulo: '¿Habilitar solicitud de turnos?',
        mensaje: 'Se enviará un email a todos los aspirantes preinscriptos este año con el link para solicitar su turno. Esta acción envía los correos inmediatamente.',
        confirmLabel: 'Habilitar y enviar emails',
        cancelLabel: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.toggleandoTurnos.set(true);
      this.configuracion.setTurnosHabilitados(true).subscribe({
        next: () => {
          this.turnosHabilitados.set(true);
          this.snackBar.open('Turnos habilitados. Se enviaron emails a los aspirantes.', 'Cerrar', { duration: 5000 });
        },
        error: err => this.snackBar.open(err.error?.mensaje || 'Error al habilitar.', 'Cerrar', { duration: 4000 }),
        complete: () => this.toggleandoTurnos.set(false)
      });
    });
  }

  deshabilitarTurnos(): void {
    this.toggleandoTurnos.set(true);
    this.configuracion.setTurnosHabilitados(false).subscribe({
      next: () => {
        this.turnosHabilitados.set(false);
        this.snackBar.open('Solicitud de turnos deshabilitada.', 'Cerrar', { duration: 3000 });
      },
      error: err => this.snackBar.open(err.error?.mensaje || 'Error.', 'Cerrar', { duration: 4000 }),
      complete: () => this.toggleandoTurnos.set(false)
    });
  }

  abrirFormDia(dia?: ConfiguracionTurno): void {
    this.editandoDia.set(dia ?? null);
    if (dia) {
      this.diaForm.setValue({
        nombre:          dia.nombre,
        fecha:           dia.fecha,
        horarioInicio:   dia.horarioInicio.substring(0, 5),
        horarioFin:      dia.horarioFin.substring(0, 5),
        cupoMaximo:      dia.cupoMaximo,
        intervaloMinutos:dia.intervaloMinutos
      });
    } else {
      this.diaForm.reset({ cupoMaximo: 100, intervaloMinutos: 5 });
    }
    this.mostrarFormDia.set(true);
  }

  cancelarFormDia(): void {
    this.mostrarFormDia.set(false);
    this.editandoDia.set(null);
    this.diaForm.reset({ cupoMaximo: 100, intervaloMinutos: 5 });
  }

  guardarDia(): void {
    if (this.diaForm.invalid) { this.diaForm.markAllAsTouched(); return; }
    this.guardandoDia.set(true);
    const v = this.diaForm.getRawValue();
    const body = {
      nombre:          v.nombre!,
      fecha:           v.fecha!,
      horarioInicio:   v.horarioInicio! + ':00',
      horarioFin:      v.horarioFin! + ':00',
      cupoMaximo:      v.cupoMaximo!,
      intervaloMinutos:v.intervaloMinutos!
    };

    const editando = this.editandoDia();
    const req$ = editando
      ? this.http.put<ApiResponse<ConfiguracionTurno>>(`/api/turnos/configuracion/${editando.id}`, body)
      : this.http.post<ApiResponse<ConfiguracionTurno>>('/api/turnos/configuracion', body);

    req$.subscribe({
      next: () => {
        this.snackBar.open(editando ? 'Día actualizado.' : 'Día creado.', 'Cerrar', { duration: 3000 });
        this.cancelarFormDia();
        this.cargarDias();
      },
      error: err => {
        this.snackBar.open(err.error?.mensaje || 'Error al guardar.', 'Cerrar', { duration: 4000 });
        this.guardandoDia.set(false);
      },
      complete: () => this.guardandoDia.set(false)
    });
  }

  eliminarDia(dia: ConfiguracionTurno): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        titulo: '¿Eliminar día de inscripción?',
        mensaje: `Se eliminará "${dia.nombre}" (${dia.fecha}) y todos los turnos asignados para ese día.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.http.delete<ApiResponse<null>>(`/api/turnos/configuracion/${dia.id}`).subscribe({
        next: () => {
          this.snackBar.open('Día eliminado.', 'Cerrar', { duration: 3000 });
          this.cargarDias();
        },
        error: err => this.snackBar.open(err.error?.mensaje || 'Error al eliminar.', 'Cerrar', { duration: 4000 })
      });
    });
  }

  irACarreras(): void { this.router.navigate(['/admin/carreras']); }
  irADocentes(): void { this.router.navigate(['/admin/docentes']); }
  irAAlumnos():  void { this.router.navigate(['/admin/alumnos']); }
  irAUsuarios(): void { this.router.navigate(['/admin/usuarios']); }

  logout(): void {
    this.authService.logout();
  }
}
