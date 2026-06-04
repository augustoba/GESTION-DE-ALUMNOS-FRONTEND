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

  private http = inject(HttpClient);
  private router = inject(Router);

  login(username: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>('/auth/login', { username, password })
      .pipe(
        tap(res => {
          if (res.data?.token) {
            localStorage.setItem(this.TOKEN_KEY, res.data.token);
            localStorage.setItem(this.ROL_KEY, res.data.rol);
            localStorage.setItem(this.USERNAME_KEY, res.data.username);
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

  logout(): void {
    [this.TOKEN_KEY, this.ROL_KEY, this.USERNAME_KEY].forEach(k =>
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
}
