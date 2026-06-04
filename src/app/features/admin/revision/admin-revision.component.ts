import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PreinscripcionDetalle } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-revision',
  imports: [
    ReactiveFormsModule,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
    MatCardModule, MatDividerModule, MatProgressSpinnerModule, MatCheckboxModule, DatePipe
  ],
  templateUrl: './admin-revision.component.html',
  styleUrl: './admin-revision.component.scss'
})
export class AdminRevisionComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  private fb           = inject(FormBuilder);

  preinscripcion = signal<PreinscripcionDetalle | null>(null);
  loading        = signal(true);
  aprobando      = signal(false);

  requisitosForm = this.fb.group({
    tituloSecundario:       [false],
    constanciaTituloTramite:[false],
    dni:                    [false],
    foto:                   [false],
    actaNacimiento:         [false],
    psicofisico:            [false],
    buenaConducta:          [false]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adminService.getDetalle(id).subscribe({
      next: res => {
        this.preinscripcion.set(res.data);
        // pre-cargar si ya fue aprobado antes
        const pre = res.data;
        this.requisitosForm.patchValue({
          tituloSecundario:        pre.reqTituloSecundario        ?? false,
          constanciaTituloTramite: pre.reqConstanciaTituloTramite ?? false,
          dni:                     pre.reqDni                     ?? false,
          foto:                    pre.reqFoto                    ?? false,
          actaNacimiento:          pre.reqActaNacimiento          ?? false,
          psicofisico:             pre.reqPsicofisico             ?? false,
          buenaConducta:           pre.reqBuenaConducta           ?? false
        });
      },
      complete: () => this.loading.set(false),
      error:    () => this.loading.set(false)
    });
  }

  aprobar(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        titulo: '¿Dar de alta al alumno?',
        mensaje: 'Se registrará qué documentos presentó el alumno y su cuenta quedará activa en el sistema.',
        confirmLabel: 'Aprobar',
        cancelLabel: 'Cancelar'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.aprobando.set(true);
      const id = this.preinscripcion()!.id;
      const v  = this.requisitosForm.getRawValue();

      this.adminService.aprobar(id, {
        tituloSecundario:        !!v.tituloSecundario,
        constanciaTituloTramite: !!v.constanciaTituloTramite,
        dni:                     !!v.dni,
        foto:                    !!v.foto,
        actaNacimiento:          !!v.actaNacimiento,
        psicofisico:             !!v.psicofisico,
        buenaConducta:           !!v.buenaConducta
      }).subscribe({
        next: () => {
          this.snackBar.open('Alumno dado de alta correctamente.', 'Cerrar', { duration: 5000 });
          this.router.navigate(['/admin/lista']);
        },
        error: () => {
          this.snackBar.open('Error al aprobar. Intente nuevamente.', 'Cerrar', { duration: 4000 });
          this.aprobando.set(false);
        }
      });
    });
  }

  volver():      void { this.router.navigate(['/admin/lista']); }
  irACarreras(): void { this.router.navigate(['/admin/carreras']); }
  irADocentes(): void { this.router.navigate(['/admin/docentes']); }
  logout():      void { this.authService.logout(); }
}
