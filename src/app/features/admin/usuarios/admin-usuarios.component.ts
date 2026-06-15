import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { UsuarioAdmin } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-usuarios',
  imports: [
    ReactiveFormsModule,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
    MatCardModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule
  ],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.scss'
})
export class AdminUsuariosComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  private fb           = inject(FormBuilder);

  usuarios    = signal<UsuarioAdmin[]>([]);
  loading     = signal(true);
  creando     = signal(false);
  mostrarForm = signal(false);

  readonly displayedColumns = ['username', 'rol', 'acciones'];

  crearForm = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol:      ['ADMIN' as 'ADMIN' | 'DOCENTE', Validators.required]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.adminService.listarAdmins().subscribe({
      next: res => this.usuarios.set(res.data),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  toggleForm(): void {
    this.mostrarForm.update(v => !v);
    if (!this.mostrarForm()) this.crearForm.reset({ rol: 'ADMIN' });
  }

  crear(): void {
    if (this.crearForm.invalid) { this.crearForm.markAllAsTouched(); return; }
    this.creando.set(true);
    const v = this.crearForm.getRawValue();
    this.adminService.crearAdmin({
      username: v.username!,
      password: v.password!,
      rol: v.rol as 'ADMIN' | 'DOCENTE'
    }).subscribe({
      next: () => {
        this.snackBar.open('Usuario creado. Se envió email de bienvenida.', 'Cerrar', { duration: 5000 });
        this.crearForm.reset({ rol: 'ADMIN' });
        this.mostrarForm.set(false);
        this.cargar();
      },
      error: err => {
        this.snackBar.open(err.error?.mensaje || 'Error al crear usuario.', 'Cerrar', { duration: 4000 });
        this.creando.set(false);
      },
      complete: () => this.creando.set(false)
    });
  }

  desactivar(u: UsuarioAdmin): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        titulo: '¿Desactivar usuario?',
        mensaje: `El usuario "${u.username}" perderá acceso al sistema.`,
        confirmLabel: 'Desactivar',
        cancelLabel: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.adminService.desactivarAdmin(u.id).subscribe({
        next: () => {
          this.snackBar.open('Usuario desactivado.', 'Cerrar', { duration: 3000 });
          this.cargar();
        },
        error: err => this.snackBar.open(err.error?.mensaje || 'Error al desactivar.', 'Cerrar', { duration: 4000 })
      });
    });
  }

  irAPre():      void { this.router.navigate(['/admin/lista']); }
  irACarreras(): void { this.router.navigate(['/admin/carreras']); }
  irADocentes(): void { this.router.navigate(['/admin/docentes']); }
  irAAlumnos():  void { this.router.navigate(['/admin/alumnos']); }
  logout():      void { this.authService.logout(); }
}
