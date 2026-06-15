import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse, PageResponse,
  Preinscripcion, PreinscripcionDetalle, EstadoPreinscripcion,
  PagoResponse, DocumentoChecklistResponse, TipoDocumento, TurnoResponse,
  Carrera, CarreraDetalle, AnioCarreraResponse, MateriaResponse,
  DocenteResumen, DocenteResponse, MateriaDetalleDocente, UsuarioAdmin, AlumnoAdmin
} from '../models/api-response.model';

export interface CarreraRequest {
  nombre: string;
  descripcion: string;
  activa: boolean;
  cupoMaximo: number;
  prefijoTurno: string;
}

export interface AnioRequest { numeroAnio: number; }

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

  habilitar(id: number): Observable<ApiResponse<Preinscripcion>> {
    return this.http.put<ApiResponse<Preinscripcion>>(`/api/preinscripciones/${id}/habilitar`, {});
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

  habilitarAlumno(id: number): Observable<ApiResponse<AlumnoAdmin>> {
    return this.http.put<ApiResponse<AlumnoAdmin>>(`/api/alumnos/${id}/habilitar`, {});
  }

  deshabilitarAlumno(id: number): Observable<ApiResponse<AlumnoAdmin>> {
    return this.http.put<ApiResponse<AlumnoAdmin>>(`/api/alumnos/${id}/deshabilitar`, {});
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
}
