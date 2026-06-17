// ── Generic ───────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  mensaje: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  token: string;
  username: string;
  rol: string;
  status: boolean | null;
  mustChangePassword: boolean;
}

export interface RegistroRequest {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  password: string;
}

// ── Enums ─────────────────────────────────────────────────────────────────────
export type EstadoPreinscripcion = 'PENDIENTE' | 'EN_REVISION' | 'HABILITADO' | 'RECHAZADO';
export type EstadoPago           = 'SIN_PAGO'  | 'PARCIAL'    | 'COMPLETO';
export type EstadoDocumento      = 'PENDIENTE' | 'SUBIDO'     | 'VALIDADO'  | 'RECHAZADO';
export type TipoDocumento =
  | 'DNI_FRENTE' | 'DNI_DORSO' | 'TITULO'
  | 'ACTA_NACIMIENTO' | 'PSICOFISICO' | 'BUENA_CONDUCTA' | 'FOTO_CARNET';

// ── Pago / Checklist ──────────────────────────────────────────────────────────
export interface PagoResponse {
  id: number;
  estado: EstadoPago;
  montoTotal: number | null;
  montoAbonado: number;
  fechaUltimoPago: string | null;
}

export interface DocumentoChecklistResponse {
  id: number;
  tipoDocumento: TipoDocumento;
  presentado: boolean;
  fechaPresentacion: string | null;
}

// ── Preinscripción ────────────────────────────────────────────────────────────
export interface CarreraRef { id: number; nombre: string; }

export interface Preinscripcion {
  id: number;
  codigoFormulario: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  localidad: string | null;
  fechaNacimiento: string | null;
  lugarNacimiento: string | null;
  nacionalidad: string | null;
  fotoUrl: string | null;
  carrera: CarreraRef | null;
  estado: EstadoPreinscripcion;
  fechaCreacion: string;
  alumno: { id: number } | null;
}

export interface PreinscripcionDetalle {
  id: number;
  codigoFormulario: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  localidad: string | null;
  fechaNacimiento: string | null;
  lugarNacimiento: string | null;
  nacionalidad: string | null;
  fotoUrl: string | null;
  carreraNombre: string | null;
  carreraId: number | null;
  estado: EstadoPreinscripcion;
  fechaCreacion: string;
  alumnoId: number | null;
  pago: PagoResponse | null;
  checklist: DocumentoChecklistResponse[];
}

// ── Turno ─────────────────────────────────────────────────────────────────────
export interface TurnoResponse {
  id: number;
  numeroTurno: string;
  horaAsignada: string;
  fechaTurno: string;
  confirmado: boolean;
  carreraNombre: string | null;
}

// ── Perfil / Documentos digitales ─────────────────────────────────────────────
export interface PerfilResponse {
  alumnoId: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  fechaNac: string | null;
  status: boolean;
  carreraNombre: string | null;
  comisionNombre: string | null;
  anioNumero: number | null;
}

export interface HorarioAlumnoItem {
  materiaId: number;
  materiaNombre: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aula: string | null;
}

export interface AsistenciaAlumnoResumen {
  alumnoId: number;
  alumnoNombre: string;
  materiaId: number;
  materiaNombre: string;
  totalClases: number;
  presentes: number;
  tardanzas: number;
  ausentes: number;
  porcentajeAsistencia: number;
  libre: boolean;
}

export interface DocumentoResumen {
  id: number;
  tipoDocumento: TipoDocumento;
  archivoUrl: string | null;
  estado: EstadoDocumento;
  motivoRechazo: string | null;
}

// ── Carrera / Materia / Comision ──────────────────────────────────────────────
export interface Carrera { id: number; nombre: string; }

export interface DocenteResumen { id: number; nombres: string; apellidos: string; email: string; }

export interface HorarioResponse {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  fechaInicioCursada: string | null;
  fechaFinCursada: string | null;
}

export interface MateriaResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  anioCarreraId: number | null;
  numeroAnio: number;
  carreraNombre: string | null;
  docente: DocenteResumen | null;
  horarios: HorarioResponse[];
}

export interface ComisionResponse {
  id: number;
  nombre: string;
  cupoMaximo: number;
  prefijoTurno: string | null;
  activa: boolean;
  alumnosCount: number;
}

export interface AnioCarreraResponse {
  id: number;
  numeroAnio: number;
  materias: MateriaResponse[];
  comisiones: ComisionResponse[];
}

export interface CarreraDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  anios: AnioCarreraResponse[];
}

// ── Docentes ──────────────────────────────────────────────────────────────────
export interface DocenteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string | null;
  activo: boolean;
}

export interface MateriaDetalleDocente {
  id: number;
  nombre: string;
  descripcion: string | null;
  carreraNombre: string | null;
  numeroAnio: number;
}

// ── Docente portal ────────────────────────────────────────────────────────────
export interface AlumnoPortal {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string | null;
  carreraNombre: string | null;
}

// ── Alumnos (ADMIN/SUPER_ADMIN) ──────────────────────────────────────────────
export interface AlumnoAdmin {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string | null;
  telefono: string | null;
  habilitado: boolean;
  comisionId: number | null;
  comisionNombre: string | null;
  anioNumero: number | null;
  carreraId: number | null;
  carreraNombre: string | null;
}

// ── Usuarios admin (SUPER_ADMIN) ──────────────────────────────────────────────
export interface UsuarioAdmin {
  id: number;
  username: string;
  rol: { id: number; nombre: string } | null;
}
