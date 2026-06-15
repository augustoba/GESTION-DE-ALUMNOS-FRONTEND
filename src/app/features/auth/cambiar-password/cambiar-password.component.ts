import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const confirmar = control.get('confirmar')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-cambiar-password',
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './cambiar-password.component.html',
  styleUrl: './cambiar-password.component.scss'
})
export class CambiarPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error   = signal('');
  hideActual  = signal(true);
  hideNueva   = signal(true);
  hideConfirm = signal(true);

  form = this.fb.group({
    passwordActual: ['', Validators.required],
    passwordNueva:  ['', [Validators.required, Validators.minLength(8)]],
    confirmar:      ['', Validators.required]
  }, { validators: passwordsMatch });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const { passwordActual, passwordNueva } = this.form.getRawValue();

    this.authService.cambiarPassword(passwordActual!, passwordNueva!).subscribe({
      next: () => {
        const rol = this.authService.getRol();
        if (rol === 'SUPER_ADMIN' || rol === 'ADMIN') this.router.navigate(['/admin/lista']);
        else if (rol === 'DOCENTE') this.router.navigate(['/docente/portal']);
        else this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.error.set(err.error?.mensaje || 'Error al cambiar la contraseña.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
