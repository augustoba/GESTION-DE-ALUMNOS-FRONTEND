import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);
  private http        = inject(HttpClient);

  loading = signal(false);
  error   = signal('');
  preinscripcionHabilitada = signal(false);
  hidePassword = signal(true);

  showForgotPassword = signal(false);
  forgotLoading = signal(false);
  forgotError = signal('');
  forgotSuccess = signal('');

  form = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.http.get<ApiResponse<{ habilitada: boolean }>>('/api/configuracion/preinscripcion').subscribe({
      next: res => this.preinscripcionHabilitada.set(res.data?.habilitada ?? false)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { username, password } = this.form.value;

    this.authService.login(username!, password!).subscribe({
      next: (res) => {
        const { rol, status, mustChangePassword } = res.data;
        if (mustChangePassword) {
          this.router.navigate(['/cambiar-password']);
          return;
        }
        if (rol === 'SUPER_ADMIN' || rol === 'ADMIN') {
          this.router.navigate(['/admin/lista']);
        } else if (rol === 'DOCENTE') {
          this.router.navigate(['/docente/portal']);
        } else if (status) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/preinscripcion']);
        }
      },
      error: () => {
        this.error.set('Email o contraseña incorrectos');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  onForgotPassword(): void {
    if (this.forgotForm.invalid) return;
    this.forgotLoading.set(true);
    this.forgotError.set('');
    this.forgotSuccess.set('');

    const email = this.forgotForm.value.email!;

    this.authService.recuperarPassword(email).subscribe({
      next: (res) => {
        this.forgotSuccess.set(res.mensaje);
        this.forgotLoading.set(false);
      },
      error: (err) => {
        this.forgotError.set(err.error?.mensaje || 'Error al recuperar la contraseña. Intentá de nuevo.');
        this.forgotLoading.set(false);
      }
    });
  }

  volverAlLogin(): void {
    this.showForgotPassword.set(false);
    this.forgotForm.reset();
    this.forgotError.set('');
    this.forgotSuccess.set('');
  }
}
