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
import { DocumentoResumen, PerfilResponse, TipoDocumento } from '../../core/models/api-response.model';

export type Section = 'inicio' | 'materias' | 'documentos' | 'perfil';

export interface Materia {
  nombre: string;
  año: number;
  condicion: 'Regular' | 'Libre' | 'Cursando' | 'Promocionado';
  notas: number[];
  asistencia: number;
}

const MATERIAS: Materia[] = [
  { nombre: 'Matemática Discreta',               año: 1, condicion: 'Regular',      notas: [6, 7, 7],   asistencia: 82 },
  { nombre: 'Algoritmos y Estructuras de Datos', año: 1, condicion: 'Regular',      notas: [8, 9, 9],   asistencia: 91 },
  { nombre: 'Inglés Técnico I',                  año: 1, condicion: 'Libre',        notas: [3, 4],      asistencia: 48 },
  { nombre: 'Arquitectura de Computadoras',      año: 1, condicion: 'Promocionado', notas: [9, 9, 10],  asistencia: 96 },
  { nombre: 'Análisis de Sistemas I',            año: 1, condicion: 'Regular',      notas: [7, 8],      asistencia: 80 },
  { nombre: 'Programación I',                    año: 1, condicion: 'Cursando',     notas: [],          asistencia: 75 },
  { nombre: 'Base de Datos I',                   año: 2, condicion: 'Cursando',     notas: [],          asistencia: 88 },
];

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

  activeSection   = signal<Section>('inicio');
  perfil          = signal<PerfilResponse | null>(null);
  documentos      = signal<DocumentoResumen[]>([]);
  loadingDocs     = signal(false);
  fotoCarnetUrl   = signal<string | null>(null);
  editandoPerfil  = signal(false);
  guardandoPerfil = signal(false);
  materias        = MATERIAS;

  tipoSubiendo   = signal<TipoDocumento | null>(null);
  subiendoDocs   = signal<Set<string>>(new Set());

  readonly TIPOS_DOC: { tipo: TipoDocumento; label: string; icono: string }[] = [
    { tipo: 'DNI_FRENTE',      label: 'DNI Frente',               icono: 'badge'           },
    { tipo: 'DNI_DORSO',       label: 'DNI Dorso',                icono: 'badge'           },
    { tipo: 'TITULO',          label: 'Título Secundario',         icono: 'school'          },
    { tipo: 'ACTA_NACIMIENTO', label: 'Acta de Nacimiento',       icono: 'article'         },
    { tipo: 'PSICOFISICO',     label: 'Psicofísico',              icono: 'local_hospital'  },
    { tipo: 'BUENA_CONDUCTA',  label: 'Cert. Buena Conducta',     icono: 'verified_user'   },
    { tipo: 'FOTO_CARNET',     label: 'Foto Carnet',              icono: 'person_pin'      },
  ];

  perfilForm = this.fb.group({
    direccion: [''],
    telefono:  ['']
  });

  readonly anios = [1, 2];

  readonly navItems: { section: Section; icon: string; label: string }[] = [
    { section: 'inicio',     icon: 'home',        label: 'Inicio'       },
    { section: 'materias',   icon: 'school',      label: 'Mis Materias' },
    { section: 'documentos', icon: 'folder_open', label: 'Documentos'   },
    { section: 'perfil',     icon: 'person',      label: 'Mi Perfil'    },
  ];

  regulares   = computed(() => this.materias.filter(m => m.condicion === 'Regular').length);
  libres      = computed(() => this.materias.filter(m => m.condicion === 'Libre').length);
  promAsist   = computed(() => {
    const vals = this.materias.map(m => m.asistencia);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  docsValidados = computed(() =>
    this.documentos().filter(d => d.estado === 'VALIDADO').length
  );
  docsSubidos = computed(() =>
    this.documentos().filter(d => d.archivoUrl != null).length
  );

  ngOnInit(): void {
    this.preinscService.getPerfil().subscribe({
      next: res => this.perfil.set(res.data)
    });
    this.cargarDocumentos();
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
            ...docs.filter(d => d.tipoDocumento !== tipo),
            res.data!
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

  materiasDeAnio(año: number): Materia[] {
    return this.materias.filter(m => m.año === año);
  }

  promedio(notas: number[]): number | null {
    if (!notas.length) return null;
    return notas.reduce((a, b) => a + b, 0) / notas.length;
  }

  estadoDocLabel(e: string): string {
    const m: Record<string, string> = {
      PENDIENTE: 'Pendiente', SUBIDO: 'Subido', VALIDADO: 'Validado', RECHAZADO: 'Rechazado'
    };
    return m[e] ?? e;
  }

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
      next: res => { this.perfil.set(res.data); this.editandoPerfil.set(false); },
      complete: () => this.guardandoPerfil.set(false),
      error:    () => this.guardandoPerfil.set(false)
    });
  }

  logout(): void { this.authService.logout(); }
}
