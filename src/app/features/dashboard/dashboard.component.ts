import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PreinscripcionService } from '../../core/services/preinscripcion.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  AsistenciaAlumnoResumen, DocumentoResumen, HorarioAlumnoItem,
  PerfilResponse, TipoDocumento
} from '../../core/models/api-response.model';

export type Section = 'inicio' | 'materias' | 'horario' | 'documentos' | 'perfil';

export interface CalendarDay {
  date: Date | null;
  horariosDia: HorarioAlumnoItem[];
}

const DIA_MAP: Record<number, string> = {
  0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
  4: 'JUEVES',  5: 'VIERNES', 6: 'SABADO'
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

@Component({
  selector: 'app-dashboard',
  imports: [
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule,
    MatButtonModule, MatCardModule, MatChipsModule, MatProgressBarModule,
    MatDividerModule, MatProgressSpinnerModule, MatFormFieldModule,
    MatInputModule, ReactiveFormsModule, DecimalPipe, MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService    = inject(AuthService);
  protected themeService = inject(ThemeService);
  private preinscService = inject(PreinscripcionService);
  private fb             = inject(FormBuilder);
  private snackBar       = inject(MatSnackBar);

  activeSection    = signal<Section>('inicio');
  perfil           = signal<PerfilResponse | null>(null);
  documentos       = signal<DocumentoResumen[]>([]);
  horarios         = signal<HorarioAlumnoItem[]>([]);
  asistencias      = signal<AsistenciaAlumnoResumen[]>([]);

  loadingDocs      = signal(false);
  loadingHorarios  = signal(false);
  loadingAsist     = signal(false);

  fotoCarnetUrl    = signal<string | null>(null);
  editandoPerfil   = signal(false);
  guardandoPerfil  = signal(false);

  tipoSubiendo  = signal<TipoDocumento | null>(null);
  subiendoDocs  = signal<Set<string>>(new Set());

  // ── Calendar state ──────────────────────────────────────────────
  calendarYear  = signal(new Date().getFullYear());
  calendarMonth = signal(new Date().getMonth());
  selectedDay   = signal<{ date: Date; horarios: HorarioAlumnoItem[] } | null>(null);

  // ── Computed ─────────────────────────────────────────────────────
  cursando = computed(() => this.asistencias().filter(a => !a.libre).length);
  libres   = computed(() => this.asistencias().filter(a => a.libre).length);
  promAsist = computed(() => {
    const all = this.asistencias();
    if (!all.length) return 0;
    return all.reduce((s, a) => s + a.porcentajeAsistencia, 0) / all.length;
  });
  docsValidados = computed(() => this.documentos().filter(d => d.estado === 'VALIDADO').length);
  docsSubidos   = computed(() => this.documentos().filter(d => d.archivoUrl != null).length);

  calendarMonthLabel = computed(() =>
    `${MESES[this.calendarMonth()]} ${this.calendarYear()}`
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const year  = this.calendarYear();
    const month = this.calendarMonth();
    const hrs   = this.horarios();

    const firstDay     = new Date(year, month, 1);
    const daysInMonth  = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Lun=0

    const cells: CalendarDay[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ date: null, horariosDia: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const diaKey = DIA_MAP[date.getDay()];
      cells.push({ date, horariosDia: hrs.filter(h => h.diaSemana === diaKey) });
    }
    return cells;
  });

  readonly TIPOS_DOC: { tipo: TipoDocumento; label: string; icono: string }[] = [
    { tipo: 'DNI_FRENTE',      label: 'DNI Frente',               icono: 'badge'           },
    { tipo: 'DNI_DORSO',       label: 'DNI Dorso',                icono: 'badge'           },
    { tipo: 'TITULO',          label: 'Título Secundario',         icono: 'school'          },
    { tipo: 'ACTA_NACIMIENTO', label: 'Acta de Nacimiento',       icono: 'article'         },
    { tipo: 'PSICOFISICO',     label: 'Psicofísico',              icono: 'local_hospital'  },
    { tipo: 'BUENA_CONDUCTA',  label: 'Cert. Buena Conducta',     icono: 'verified_user'   },
    { tipo: 'FOTO_CARNET',     label: 'Foto Carnet',              icono: 'person_pin'      },
  ];

  perfilForm = this.fb.group({ direccion: [''], telefono: [''] });

  readonly navItems: { section: Section; icon: string; label: string }[] = [
    { section: 'inicio',     icon: 'home',           label: 'Inicio'       },
    { section: 'materias',   icon: 'school',          label: 'Mis Materias' },
    { section: 'horario',    icon: 'calendar_month',  label: 'Mi Horario'   },
    { section: 'documentos', icon: 'folder_open',     label: 'Documentos'   },
    { section: 'perfil',     icon: 'person',          label: 'Mi Perfil'    },
  ];

  ngOnInit(): void {
    this.preinscService.getPerfil().subscribe({ next: res => this.perfil.set(res.data) });
    this.cargarDocumentos();
    this.cargarHorarios();
    this.cargarAsistencias();
  }

  setSection(section: Section): void {
    this.activeSection.set(section);
    if (section === 'documentos') this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.loadingDocs.set(true);
    this.preinscService.getDocumentos().subscribe({
      next: res => {
        this.documentos.set(res.data ?? []);
        this.actualizarFotoCarnet(res.data ?? []);
      },
      complete: () => this.loadingDocs.set(false),
      error:    () => this.loadingDocs.set(false)
    });
  }

  cargarHorarios(): void {
    this.loadingHorarios.set(true);
    this.preinscService.getHorarios().subscribe({
      next:     res => this.horarios.set(res.data ?? []),
      complete: () => this.loadingHorarios.set(false),
      error:    () => this.loadingHorarios.set(false)
    });
  }

  cargarAsistencias(): void {
    this.loadingAsist.set(true);
    this.preinscService.getAsistenciasResumen().subscribe({
      next:     res => this.asistencias.set(res.data ?? []),
      complete: () => this.loadingAsist.set(false),
      error:    () => this.loadingAsist.set(false)
    });
  }

  // ── Calendar ─────────────────────────────────────────────────────
  prevMonth(): void {
    let m = this.calendarMonth() - 1, y = this.calendarYear();
    if (m < 0) { m = 11; y--; }
    this.calendarMonth.set(m); this.calendarYear.set(y);
    this.selectedDay.set(null);
  }

  nextMonth(): void {
    let m = this.calendarMonth() + 1, y = this.calendarYear();
    if (m > 11) { m = 0; y++; }
    this.calendarMonth.set(m); this.calendarYear.set(y);
    this.selectedDay.set(null);
  }

  selectDay(cell: CalendarDay): void {
    if (!cell.date || !cell.horariosDia.length) { this.selectedDay.set(null); return; }
    const sel = this.selectedDay();
    if (sel?.date.getTime() === cell.date.getTime()) {
      this.selectedDay.set(null);
    } else {
      this.selectedDay.set({ date: cell.date, horarios: cell.horariosDia });
    }
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;
    const t = new Date();
    return date.getDate() === t.getDate() &&
           date.getMonth() === t.getMonth() &&
           date.getFullYear() === t.getFullYear();
  }

  formatSelectedDate(date: Date): string {
    return `${DIAS_ES[date.getDay()]} ${date.getDate()} de ${MESES[date.getMonth()].toLowerCase()}`;
  }

  // ── Documentos ───────────────────────────────────────────────────
  private actualizarFotoCarnet(docs: DocumentoResumen[]): void {
    const foto = docs.find(d => d.tipoDocumento === 'FOTO_CARNET' && d.archivoUrl);
    this.fotoCarnetUrl.set(foto?.archivoUrl ?? null);
  }

  docPorTipo(tipo: TipoDocumento): DocumentoResumen | null {
    return this.documentos().find(d => d.tipoDocumento === tipo) ?? null;
  }

  iniciarUpload(tipo: TipoDocumento, input: HTMLInputElement): void {
    this.tipoSubiendo.set(tipo);
    input.value = '';
    input.click();
  }

  onFileSelected(event: Event): void {
    const tipo = this.tipoSubiendo();
    if (!tipo) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) { this.tipoSubiendo.set(null); return; }
    this.realizarUpload(tipo, file);
  }

  private realizarUpload(tipo: TipoDocumento, archivo: File): void {
    this.subiendoDocs.update(s => new Set([...s, tipo]));
    this.preinscService.subirDocumento(tipo, archivo).subscribe({
      next: res => {
        if (res.data) {
          this.documentos.update(docs => [
            ...docs.filter(d => d.tipoDocumento !== tipo), res.data!
          ]);
          this.actualizarFotoCarnet(this.documentos());
          this.snackBar.open('Documento subido correctamente.', 'Cerrar', { duration: 3000 });
        }
      },
      error: err => {
        this.snackBar.open(err.error?.mensaje ?? 'Error al subir el documento.', 'Cerrar', { duration: 4000 });
      },
      complete: () => {
        this.subiendoDocs.update(s => { const n = new Set(s); n.delete(tipo); return n; });
        this.tipoSubiendo.set(null);
      }
    });
  }

  verDocumento(doc: DocumentoResumen): void {
    if (doc.archivoUrl) window.open(doc.archivoUrl, '_blank');
  }

  // ── Perfil ───────────────────────────────────────────────────────
  iniciarEdicion(): void {
    const p = this.perfil();
    this.perfilForm.setValue({ direccion: p?.direccion ?? '', telefono: p?.telefono ?? '' });
    this.editandoPerfil.set(true);
  }

  cancelarEdicion(): void { this.editandoPerfil.set(false); }

  guardarPerfil(): void {
    const { direccion, telefono } = this.perfilForm.value;
    this.guardandoPerfil.set(true);
    this.preinscService.actualizarPerfil(direccion ?? '', telefono ?? '').subscribe({
      next:     res => { this.perfil.set(res.data); this.editandoPerfil.set(false); },
      complete: () => this.guardandoPerfil.set(false),
      error:    () => this.guardandoPerfil.set(false)
    });
  }

  logout(): void { this.authService.logout(); }
}
