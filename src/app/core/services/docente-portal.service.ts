import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, MateriaDetalleDocente, AlumnoPortal } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class DocentePortalService {
  private http = inject(HttpClient);

  getMisMaterias(): Observable<ApiResponse<MateriaDetalleDocente[]>> {
    return this.http.get<ApiResponse<MateriaDetalleDocente[]>>('/api/docente-portal/mis-materias');
  }

  getMisAlumnos(): Observable<ApiResponse<AlumnoPortal[]>> {
    return this.http.get<ApiResponse<AlumnoPortal[]>>('/api/docente-portal/mis-alumnos');
  }

  getAlumno(id: number): Observable<ApiResponse<AlumnoPortal>> {
    return this.http.get<ApiResponse<AlumnoPortal>>(`/api/docente-portal/alumnos/${id}`);
  }
}
