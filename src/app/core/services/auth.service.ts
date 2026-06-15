import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiResponse, LoginResponse, RegistroRequest } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ga_token';
  private readonly ROL_KEY = 'ga_rol';
  private readonly USERNAME_KEY = 'ga_username';
  private readonly MUST_CHANGE_KEY = 'ga_must_change';

  private http = inject(HttpClient);
  private router = inject(Router);

  private guardInterval: ReturnType<typeof setInterval> | null = null;
  private lastActivity = Date.now();
  private readonly activityHandler = () => { this.lastActivity = Date.now(); };

  constructor() {
    if (this.isLoggedIn()) {
      this.startSessionGuard();
    }
  }

  login(username: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>('/auth/login', { username, password })
      .pipe(
        tap(res => {
          if (res.data?.token) {
            localStorage.setItem(this.TOKEN_KEY, res.data.token);
            localStorage.setItem(this.ROL_KEY, res.data.rol);
            localStorage.setItem(this.USERNAME_KEY, res.data.username);
            localStorage.setItem(this.MUST_CHANGE_KEY, String(res.data.mustChangePassword ?? false));
            this.startSessionGuard();
          }
        })
      );
  }

  registro(data: RegistroRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/auth/registro', data);
  }

  recuperarPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/auth/recuperar-password', { email });
  }

  validarToken(token: string): Observable<ApiResponse<{ email: string; nombres: string }>> {
    return this.http.get<ApiResponse<{ email: string; nombres: string }>>(
      `/auth/validar-token?token=${encodeURIComponent(token)}`
    );
  }

  activarCuenta(token: string, password: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/auth/activar', { token, password });
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/auth/cambiar-password', { passwordActual, passwordNueva }).pipe(
      tap(() => localStorage.setItem(this.MUST_CHANGE_KEY, 'false'))
    );
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>('/auth/refresh', {}).pipe(
      tap(res => {
        if (res.data?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.data.token);
        }
      })
    );
  }

  getMustChangePassword(): boolean {
    return localStorage.getItem(this.MUST_CHANGE_KEY) === 'true';
  }

  logout(): void {
    this.stopSessionGuard();
    [this.TOKEN_KEY, this.ROL_KEY, this.USERNAME_KEY, this.MUST_CHANGE_KEY].forEach(k =>
      localStorage.removeItem(k)
    );
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRol(): string | null {
    return localStorage.getItem(this.ROL_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      return exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getTokenExpiry(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      return exp * 1000;
    } catch {
      return null;
    }
  }

  isTokenExpiringSoon(thresholdMs = 5 * 60 * 1000): boolean {
    const expiry = this.getTokenExpiry();
    if (expiry === null) return false;
    return expiry - Date.now() < thresholdMs;
  }

  startSessionGuard(): void {
    this.stopSessionGuard();
    this.lastActivity = Date.now();
    document.addEventListener('mousemove', this.activityHandler, { passive: true });
    document.addEventListener('click', this.activityHandler, { passive: true });
    document.addEventListener('keydown', this.activityHandler, { passive: true });

    this.guardInterval = setInterval(() => {
      if (!this.isLoggedIn()) {
        this.logout();
        return;
      }
      const userActiveRecently = Date.now() - this.lastActivity < 5 * 60 * 1000;
      if (this.isTokenExpiringSoon() && userActiveRecently) {
        this.refreshToken().subscribe({ error: () => this.logout() });
      }
    }, 60_000);
  }

  stopSessionGuard(): void {
    if (this.guardInterval !== null) {
      clearInterval(this.guardInterval);
      this.guardInterval = null;
    }
    document.removeEventListener('mousemove', this.activityHandler);
    document.removeEventListener('click', this.activityHandler);
    document.removeEventListener('keydown', this.activityHandler);
  }
}
