import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse, Preinscripcion, PreinscripcionDetalle,
  PageResponse, EstadoDocumento,
  Carrera, CarreraDetalle, AnioCarreraResponse, MateriaResponse, DocenteResumen,
  DocenteResponse, MateriaDetalleDocente
} from '../models/api-response.model';

export interface DocenteRequest {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
}

export interface CarreraRequest {
  nombre: string;
  descripcion: string;
  activa: boolean;
  cupoMaximo: number;
}

export interface AnioRequest { numeroAnio: number; }

export interface MateriaRequest {
  nombre: string;
  descripcion: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  docenteId: number | null;
}

export interface RevisionRequest {
  decisiones: { documentoId: number; estado: EstadoDocumento }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getPreinscripciones(page = 0, size = 50): Observable<ApiResponse<PageResponse<Preinscripcion>>> {
    return this.http.get<ApiResponse<PageResponse<Preinscripcion>>>(
      `/api/preinscripciones?page=${page}&size=${size}`
    );
  }

  getConDocumentosPendientes(): Observable<ApiResponse<Preinscripcion[]>> {
    return this.http.get<ApiResponse<Preinscripcion[]>>('/api/preinscripciones/con-documentos-pendientes');
  }

  getConDocumentosRechazados(): Observable<ApiResponse<Preinscripcion[]>> {
    return this.http.get<ApiResponse<Preinscripcion[]>>('/api/preinscripciones/con-documentos-rechazados');
  }

  getConDocumentosFaltantes(): Observable<ApiResponse<Preinscripcion[]>> {
    return this.http.get<ApiResponse<Preinscripcion[]>>('/api/preinscripciones/con-documentos-faltantes');
  }

  getDetalle(id: number): Observable<ApiResponse<PreinscripcionDetalle>> {
    return this.http.get<ApiResponse<PreinscripcionDetalle>>(`/api/preinscripciones/${id}`);
  }

  confirmarRevision(id: number, request: RevisionRequest): Observable<ApiResponse<Preinscripcion>> {
    return this.http.put<ApiResponse<Preinscripcion>>(
      `/api/preinscripciones/${id}/confirmar-revision`, request
    );
  }

  getDocumentoBlob(documentoId: number): Observable<Blob> {
    return this.http.get(`/api/documentos/${documentoId}/descargar`, { responseType: 'blob' });
  }

  // ── Carreras admin ──────────────────────────────────────────

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

  // ── Docentes CRUD ───────────────────────────────────────────

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
}
