import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse, PageResponse,
  Preinscripcion, PreinscripcionDetalle, EstadoPreinscripcion,
  PagoResponse, DocumentoChecklistResponse, TipoDocumento, TurnoResponse,
  Carrera, CarreraDetalle, AnioCarreraResponse, MateriaResponse, ComisionResponse,
  DocenteResumen, DocenteResponse, MateriaDetalleDocente, UsuarioAdmin, AlumnoAdmin
} from '../models/api-response.model';

export interface HorarioRequest {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  fechaInicioCursada?: string | null;
  fechaFinCursada?: string | null;
}

export interface MateriaGestionRequest {
  nombre: string;
  descripcion?: string | null;
  anioCarreraId: number;
  docenteId?: number | null;
  horarios?: HorarioRequest[];
}

export interface CarreraRequest {
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export interface AnioRequest { numeroAnio: number; }

export interface ComisionRequest {
  nombre: string;
  cupoMaximo: number;
  prefijoTurno: string | null;
  activa: boolean;
}

export interface MateriaRequest {
  nombre: string;
  descripcion: string;
  docenteId: number | null;
}

export interface DocenteRequest {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  materiasIds?: number[];
}

export interface PagoRequest {
  montoAbonado: number;
  montoTotal?: number;
}

export interface UsuarioAdminRequest {
  username: string;
  password: string;
  rol: 'ADMIN' | 'DOCENTE';
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  // ── Preinscripciones — listado / búsqueda ─────────────────────────────────

  getPreinscripciones(page = 0, size = 50): Observable<ApiResponse<PageResponse<Preinscripcion>>> {
    return this.http.get<ApiResponse<PageResponse<Preinscripcion>>>(
      `/api/preinscripciones?page=${page}&size=${size}`
    );
  }

  listarPorEstado(estado: EstadoPreinscripcion, page = 0, size = 50): Observable<ApiResponse<PageResponse<Preinscripcion>>> {
    return this.http.get<ApiResponse<PageResponse<Preinscripcion>>>(
      `/api/preinscripciones/estado/${estado}?page=${page}&size=${size}`
    );
  }

  buscarPorCodigo(codigo: string): Observable<ApiResponse<Preinscripcion[]>> {
    return this.http.get<ApiResponse<Preinscripcion[]>>(`/api/preinscripciones/buscar/codigo?codigo=${encodeURIComponent(codigo)}`);
  }

  buscarPorDni(dni: string): Observable<ApiResponse<Preinscripcion>> {
    return this.http.get<ApiResponse<Preinscripcion>>(`/api/preinscripciones/buscar/dni?dni=${encodeURIComponent(dni)}`);
  }

  buscarPorNombre(nombre: string, apellido: string, page = 0, size = 50): Observable<ApiResponse<PageResponse<Preinscripcion>>> {
    return this.http.get<ApiResponse<PageResponse<Preinscripcion>>>(
      `/api/preinscripciones/buscar/nombre?nombre=${encodeURIComponent(nombre)}&apellido=${encodeURIComponent(apellido)}&page=${page}&size=${size}`
    );
  }

  getDetalle(id: number): Observable<ApiResponse<PreinscripcionDetalle>> {
    return this.http.get<ApiResponse<PreinscripcionDetalle>>(`/api/preinscripciones/${id}`);
  }

  // ── Preinscripciones — cambios de estado ─────────────────────────────────

  enRevision(id: number): Observable<ApiResponse<Preinscripcion>> {
    return this.http.put<ApiResponse<Preinscripcion>>(`/api/preinscripciones/${id}/en-revision`, {});
  }

  habilitar(id: number, comisionId: number): Observable<ApiResponse<Preinscripcion>> {
    return this.http.put<ApiResponse<Preinscripcion>>(`/api/preinscripciones/${id}/habilitar`, { comisionId });
  }

  rechazar(id: number): Observable<ApiResponse<Preinscripcion>> {
    return this.http.put<ApiResponse<Preinscripcion>>(`/api/preinscripciones/${id}/rechazar`, {});
  }

  // ── Pago ─────────────────────────────────────────────────────────────────

  registrarPago(id: number, req: PagoRequest): Observable<ApiResponse<PagoResponse>> {
    return this.http.post<ApiResponse<PagoResponse>>(`/api/preinscripciones/${id}/pago`, req);
  }

  verPago(id: number): Observable<ApiResponse<PagoResponse>> {
    return this.http.get<ApiResponse<PagoResponse>>(`/api/preinscripciones/${id}/pago`);
  }

  anularPago(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/preinscripciones/${id}/pago`);
  }

  // ── Checklist ────────────────────────────────────────────────────────────

  verChecklist(id: number): Observable<ApiResponse<DocumentoChecklistResponse[]>> {
    return this.http.get<ApiResponse<DocumentoChecklistResponse[]>>(`/api/preinscripciones/${id}/checklist`);
  }

  marcarDocumento(id: number, tipo: TipoDocumento): Observable<ApiResponse<DocumentoChecklistResponse>> {
    return this.http.post<ApiResponse<DocumentoChecklistResponse>>(`/api/preinscripciones/${id}/checklist/${tipo}`, {});
  }

  desmarcarDocumento(id: number, tipo: TipoDocumento): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/preinscripciones/${id}/checklist/${tipo}`);
  }

  // ── Turno ─────────────────────────────────────────────────────────────────

  asignarTurno(id: number): Observable<ApiResponse<TurnoResponse>> {
    return this.http.post<ApiResponse<TurnoResponse>>(`/api/preinscripciones/${id}/turno`, {});
  }

  verTurno(id: number): Observable<ApiResponse<TurnoResponse>> {
    return this.http.get<ApiResponse<TurnoResponse>>(`/api/preinscripciones/${id}/turno`);
  }

  // ── Carreras ──────────────────────────────────────────────────────────────

  getCarreras(): Observable<ApiResponse<Carrera[]>> {
    return this.http.get<ApiResponse<Carrera[]>>('/api/carreras/todas');
  }

  getCarreraDetalle(id: number): Observable<ApiResponse<CarreraDetalle>> {
    return this.http.get<ApiResponse<CarreraDetalle>>(`/api/carreras/${id}/detalle`);
  }

  crearCarrera(req: CarreraRequest): Observable<ApiResponse<Carrera>> {
    return this.http.post<ApiResponse<Carrera>>('/api/carreras', req);
  }

  actualizarCarrera(id: number, req: CarreraRequest): Observable<ApiResponse<Carrera>> {
    return this.http.put<ApiResponse<Carrera>>(`/api/carreras/${id}`, req);
  }

  eliminarCarrera(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/carreras/${id}`);
  }

  agregarAnio(carreraId: number, req: AnioRequest): Observable<ApiResponse<AnioCarreraResponse>> {
    return this.http.post<ApiResponse<AnioCarreraResponse>>(`/api/carreras/${carreraId}/anios`, req);
  }

  eliminarAnio(anioId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/carreras/anios/${anioId}`);
  }

  agregarMateria(anioId: number, req: MateriaRequest): Observable<ApiResponse<MateriaResponse>> {
    return this.http.post<ApiResponse<MateriaResponse>>(`/api/carreras/anios/${anioId}/materias`, req);
  }

  actualizarMateria(materiaId: number, req: MateriaRequest): Observable<ApiResponse<MateriaResponse>> {
    return this.http.put<ApiResponse<MateriaResponse>>(`/api/carreras/materias/${materiaId}`, req);
  }

  eliminarMateria(materiaId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/carreras/materias/${materiaId}`);
  }

  agregarComision(anioId: number, req: ComisionRequest): Observable<ApiResponse<ComisionResponse>> {
    return this.http.post<ApiResponse<ComisionResponse>>(`/api/carreras/anios/${anioId}/comisiones`, req);
  }

  actualizarComision(comisionId: number, req: ComisionRequest): Observable<ApiResponse<ComisionResponse>> {
    return this.http.put<ApiResponse<ComisionResponse>>(`/api/carreras/comisiones/${comisionId}`, req);
  }

  eliminarComision(comisionId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/carreras/comisiones/${comisionId}`);
  }

  getDocentes(): Observable<ApiResponse<DocenteResumen[]>> {
    return this.http.get<ApiResponse<DocenteResumen[]>>('/api/carreras/docentes');
  }

  // ── Docentes CRUD ─────────────────────────────────────────────────────────

  getDocentesTodos(): Observable<ApiResponse<DocenteResponse[]>> {
    return this.http.get<ApiResponse<DocenteResponse[]>>('/api/docentes');
  }

  crearDocente(req: DocenteRequest): Observable<ApiResponse<DocenteResponse>> {
    return this.http.post<ApiResponse<DocenteResponse>>('/api/docentes', req);
  }

  actualizarDocente(id: number, req: DocenteRequest): Observable<ApiResponse<DocenteResponse>> {
    return this.http.put<ApiResponse<DocenteResponse>>(`/api/docentes/${id}`, req);
  }

  cambiarEstadoDocente(id: number, activo: boolean): Observable<ApiResponse<DocenteResponse>> {
    return this.http.patch<ApiResponse<DocenteResponse>>(
      `/api/docentes/${id}/estado?activo=${activo}`, {}
    );
  }

  getDocenteMaterias(id: number): Observable<ApiResponse<MateriaDetalleDocente[]>> {
    return this.http.get<ApiResponse<MateriaDetalleDocente[]>>(`/api/docentes/${id}/materias`);
  }

  // ── Alumnos ──────────────────────────────────────────────────────────────

  getAlumnos(page = 0, size = 50): Observable<ApiResponse<PageResponse<AlumnoAdmin>>> {
    return this.http.get<ApiResponse<PageResponse<AlumnoAdmin>>>(`/api/alumnos?page=${page}&size=${size}`);
  }

  buscarAlumnos(nombre: string, apellido: string, page = 0, size = 50): Observable<ApiResponse<PageResponse<AlumnoAdmin>>> {
    return this.http.get<ApiResponse<PageResponse<AlumnoAdmin>>>(
      `/api/alumnos/buscar?nombre=${encodeURIComponent(nombre)}&apellido=${encodeURIComponent(apellido)}&page=${page}&size=${size}`
    );
  }

  getAlumno(id: number): Observable<ApiResponse<AlumnoAdmin>> {
    return this.http.get<ApiResponse<AlumnoAdmin>>(`/api/alumnos/${id}`);
  }

  habilitarAlumno(id: number): Observable<ApiResponse<AlumnoAdmin>> {
    return this.http.put<ApiResponse<AlumnoAdmin>>(`/api/alumnos/${id}/habilitar`, {});
  }

  deshabilitarAlumno(id: number): Observable<ApiResponse<AlumnoAdmin>> {
    return this.http.put<ApiResponse<AlumnoAdmin>>(`/api/alumnos/${id}/deshabilitar`, {});
  }

  reenviarActivacion(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`/api/alumnos/${id}/reenviar-activacion`, {});
  }

  // ── SUPER_ADMIN — gestión de usuarios ────────────────────────────────────

  listarAdmins(): Observable<ApiResponse<UsuarioAdmin[]>> {
    return this.http.get<ApiResponse<UsuarioAdmin[]>>('/api/admin/usuarios');
  }

  crearAdmin(req: UsuarioAdminRequest): Observable<ApiResponse<UsuarioAdmin>> {
    return this.http.post<ApiResponse<UsuarioAdmin>>('/api/admin/usuarios', req);
  }

  desactivarAdmin(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/admin/usuarios/${id}`);
  }

  // ── Materias (ABM) ────────────────────────────────────────────────────────

  getTodasMaterias(): Observable<ApiResponse<MateriaResponse[]>> {
    return this.http.get<ApiResponse<MateriaResponse[]>>('/api/materias');
  }

  getMateriasPorAnio(anioId: number): Observable<ApiResponse<MateriaResponse[]>> {
    return this.http.get<ApiResponse<MateriaResponse[]>>(`/api/materias/anio-carrera/${anioId}`);
  }

  crearMateriaGestion(req: MateriaGestionRequest): Observable<ApiResponse<MateriaResponse>> {
    return this.http.post<ApiResponse<MateriaResponse>>('/api/materias', req);
  }

  actualizarMateriaGestion(id: number, req: MateriaGestionRequest): Observable<ApiResponse<MateriaResponse>> {
    return this.http.put<ApiResponse<MateriaResponse>>(`/api/materias/${id}`, req);
  }

  eliminarMateriaGestion(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`/api/materias/${id}`);
  }

  asignarMateriaADocente(docenteId: number, materiaId: number): Observable<ApiResponse<MateriaDetalleDocente[]>> {
    return this.http.post<ApiResponse<MateriaDetalleDocente[]>>(`/api/docentes/${docenteId}/materias/${materiaId}`, {});
  }

  desasignarMateriaDeDocente(docenteId: number, materiaId: number): Observable<ApiResponse<MateriaDetalleDocente[]>> {
    return this.http.delete<ApiResponse<MateriaDetalleDocente[]>>(`/api/docentes/${docenteId}/materias/${materiaId}`);
  }
}
