import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

type Estado = 'validando' | 'formulario' | 'exito' | 'error';

function passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-activar-cuenta',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './activar-cuenta.component.html',
  styleUrl:    './activar-cuenta.component.scss',
})
export class ActivarCuentaComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private fb          = inject(FormBuilder);

  estado    = signal<Estado>('validando');
  errorMsg  = signal('');
  nombres   = signal('');
  enviando  = signal(false);
  ocultarPw = signal(true);
  ocultarCo = signal(true);

  private token = '';

  form = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsCoinciden });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.errorMsg.set('El enlace no contiene un token de activación.');
      this.estado.set('error');
      return;
    }

    this.authService.validarToken(this.token).subscribe({
      next: res => {
        this.nombres.set(res.data?.nombres ?? '');
        this.estado.set('formulario');
      },
      error: err => {
        this.errorMsg.set(err.error?.mensaje ?? 'El enlace de activación no es válido o ya expiró.');
        this.estado.set('error');
      },
    });
  }

  activar(): void {
    if (this.form.invalid || this.enviando()) return;

    this.enviando.set(true);
    const { password } = this.form.value;

    this.authService.activarCuenta(this.token, password!).subscribe({
      next: () => {
        this.estado.set('exito');
        setTimeout(() => this.router.navigate(['/login']), 4000);
      },
      error: err => {
        this.errorMsg.set(err.error?.mensaje ?? 'Ocurrió un error. Intentá nuevamente.');
        this.enviando.set(false);
      },
    });
  }
}
