import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Carrera, DocumentoResumen, PerfilResponse } from '../models/api-response.model';

export interface PreinscripcionRequest {
  nombres: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  nacionalidad: string;
  domicilio: string;
  localidad: string;
  telefono: string;
  email: string;
  egresadoDe: string;
  tituloDe: string;
  debeMaterias: boolean;
  materiasAdeudadas: string | null;
  afeccionEspecifica: string | null;
  grupoSanguineo: string;
  carreraId: number | null;
}

@Injectable({ providedIn: 'root' })
export class PreinscripcionService {
  private http = inject(HttpClient);

  crear(request: PreinscripcionRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/api/preinscripciones', request);
  }

  getCarreras(): Observable<ApiResponse<Carrera[]>> {
    return this.http.get<ApiResponse<Carrera[]>>('/api/carreras');
  }

  getPerfil(): Observable<ApiResponse<PerfilResponse>> {
    return this.http.get<ApiResponse<PerfilResponse>>('/api/perfil');
  }

  getDocumentos(): Observable<ApiResponse<DocumentoResumen[]>> {
    return this.http.get<ApiResponse<DocumentoResumen[]>>('/api/perfil/documentos');
  }

  getDocumentoBlob(documentoId: number): Observable<Blob> {
    return this.http.get(`/api/documentos/${documentoId}/descargar`, { responseType: 'blob' });
  }

  resubirDocumento(preinscripcionId: number, tipo: string, archivo: File): Observable<ApiResponse> {
    const fd = new FormData();
    fd.append('tipo', tipo);
    fd.append('archivo', archivo);
    return this.http.post<ApiResponse>(`/api/documentos/preinscripcion/${preinscripcionId}`, fd);
  }

  actualizarPerfil(direccion: string, telefono: string): Observable<ApiResponse<PerfilResponse>> {
    return this.http.put<ApiResponse<PerfilResponse>>('/api/perfil', { direccion, telefono });
  }
}
