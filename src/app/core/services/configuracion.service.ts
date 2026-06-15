import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);

  getPreinscripcionHabilitada(): Observable<boolean> {
    return this.http.get<ApiResponse>('/api/configuracion/preinscripcion').pipe(
      map(res => (res.data as { habilitada: boolean }).habilitada)
    );
  }

  setPreinscripcionHabilitada(habilitada: boolean): Observable<ApiResponse> {
    return this.http.put<ApiResponse>('/api/configuracion/preinscripcion', { habilitada });
  }

  getTurnosHabilitados(): Observable<boolean> {
    return this.http.get<ApiResponse>('/api/configuracion/turnos').pipe(
      map(res => (res.data as { habilitados: boolean }).habilitados)
    );
  }

  setTurnosHabilitados(habilitado: boolean): Observable<ApiResponse> {
    return this.http.put<ApiResponse>('/api/configuracion/turnos', { habilitado });
  }
}
