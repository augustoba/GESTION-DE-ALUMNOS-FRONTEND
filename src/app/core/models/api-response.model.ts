export interface ApiResponse<T = unknown> {
  mensaje: string;
  data: T;
}

export interface LoginResponse {
  token: string;
  username: string;
  rol: string;
  status: boolean | null;
}

export interface RegistroRequest {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  password: string;
}

export interface Carrera {
  id: number;
  nombre: string;
}

export interface PerfilResponse {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  fechaNac: string | null;
  status: boolean;
}

export type EstadoDocumento = 'PENDIENTE' | 'VALIDADO' | 'RESUBIR';
export type TipoDocumento = 'DNI_FRENTE' | 'DNI_DORSO' | 'TITULO' | 'FOTO_CARNET' | 'COMPROBANTE_PAGO';
export type EstadoPreinscripcion =
  'PENDIENTE_PAGO' | 'PAGO_VALIDADO' | 'DOCUMENTOS_COMPLETOS' | 'APROBADA' | 'EXPIRADA';

export interface DocumentoResumen {
  id: number;
  preinscripcionId: number;
  tipo: TipoDocumento;
  nombreArchivo: string;
  contentType: string;
  estado: EstadoDocumento;
}

export interface CarreraRef {
  id: number;
  nombre: string;
}

export interface Preinscripcion {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  carrera: CarreraRef | null;
  pagoValidado: boolean | null;
  documentosCompletos: boolean | null;
  fechaCreacion: string;
  estado: EstadoPreinscripcion;
}

export interface PreinscripcionDetalle {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  carrera: string | null;
  fechaCreacion: string;
  estado: EstadoPreinscripcion;
  pagoValidado: boolean | null;
  documentosCompletos: boolean | null;
  documentos: DocumentoResumen[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Carreras admin ────────────────────────────────────────────────

export interface DocenteResumen {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface MateriaResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  diaSemana: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  aula: string | null;
  docente: DocenteResumen | null;
}

export interface AnioCarreraResponse {
  id: number;
  numeroAnio: number;
  materias: MateriaResponse[];
}

export interface MateriaDetalleDocente {
  id: number;
  nombre: string;
  descripcion: string | null;
  carreraNombre: string | null;
  numeroAnio: number;
  diaSemana: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  aula: string | null;
}

export interface DocenteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string | null;
  activo: boolean;
}

export interface CarreraDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  cupoMaximo: number;
  anios: AnioCarreraResponse[];
}

// ── Docente portal ────────────────────────────────────────────────

export interface AlumnoPortal {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string | null;
  carreraNombre: string | null;
}
