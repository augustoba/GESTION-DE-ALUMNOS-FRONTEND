import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlumnoAdmin } from '../../../core/models/api-response.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-alumno-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatCardModule, MatProgressSpinnerModule, MatDividerModule,
    MatListModule, MatTooltipModule, MatSnackBarModule
  ],
  templateUrl: './admin-alumno-detalle.component.html',
  styleUrl: './admin-alumno-detalle.component.scss'
})
export class AdminAlumnoDetalleComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);

  alumno               = signal<AlumnoAdmin | null>(null);
  loading              = signal(true);
  enviandoActivacion   = signal(false);

  get isSuperAdmin(): boolean { return this.authService.getRol() === 'SUPER_ADMIN'; }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adminService.getAlumno(id).subscribe({
      next: res => { this.alumno.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  habilitar(): void {
    const a = this.alumno();
    if (!a) return;
    this.adminService.habilitarAlumno(a.id).subscribe({
      next: res => {
        this.alumno.set(res.data);
        this.snackBar.open('Alumno habilitado.', 'Cerrar', { duration: 3000 });
      },
      error: err => this.snackBar.open(err.error?.mensaje || 'Error al habilitar.', 'Cerrar', { duration: 4000 })
    });
  }

  deshabilitar(): void {
    const a = this.alumno();
    if (!a) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        titulo: '¿Deshabilitar alumno?',
        mensaje: `${a.apellidos}, ${a.nombres} perderá acceso al sistema hasta que sea habilitado nuevamente.`,
        confirmLabel: 'Deshabilitar',
        cancelLabel: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.adminService.deshabilitarAlumno(a.id).subscribe({
        next: res => {
          this.alumno.set(res.data);
          this.snackBar.open('Alumno deshabilitado.', 'Cerrar', { duration: 3000 });
        },
        error: err => this.snackBar.open(err.error?.mensaje || 'Error al deshabilitar.', 'Cerrar', { duration: 4000 })
      });
    });
  }

  reenviarActivacion(): void {
    const a = this.alumno();
    if (!a) return;
    this.enviandoActivacion.set(true);
    this.adminService.reenviarActivacion(a.id).subscribe({
      next: () => {
        this.snackBar.open('Email de activación reenviado correctamente.', 'Cerrar', { duration: 4000 });
        this.enviandoActivacion.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.mensaje || 'Error al reenviar el email.', 'Cerrar', { duration: 5000 });
        this.enviandoActivacion.set(false);
      }
    });
  }

  volver():      void { this.router.navigate(['/admin/alumnos']); }
  irAPre():      void { this.router.navigate(['/admin/lista']); }
  irACarreras(): void { this.router.navigate(['/admin/carreras']); }
  irADocentes(): void { this.router.navigate(['/admin/docentes']); }
  irAUsuarios(): void { this.router.navigate(['/admin/usuarios']); }
  logout():      void { this.authService.logout(); this.router.navigate(['/login']); }
}
