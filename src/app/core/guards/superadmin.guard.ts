import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.getRol() !== 'SUPER_ADMIN') {
    router.navigate(['/admin/lista']);
    return false;
  }
  return true;
};
