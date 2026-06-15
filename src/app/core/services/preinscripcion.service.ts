import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Carrera, DocumentoResumen, PerfilResponse, TipoDocumento } from '../models/api-response.model';

export interface PreinscripcionRequest {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string | null;
  lugarNacimiento: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  localidad: string | null;
  telefono: string | null;
  email: string;
  fotoUrl: string | null;
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

  actualizarPerfil(direccion: string, telefono: string): Observable<ApiResponse<PerfilResponse>> {
    return this.http.put<ApiResponse<PerfilResponse>>('/api/perfil', { direccion, telefono });
  }

  subirDocumento(tipo: TipoDocumento, archivo: File): Observable<ApiResponse<DocumentoResumen>> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<ApiResponse<DocumentoResumen>>(`/api/perfil/documentos/${tipo}`, formData);
  }
}
