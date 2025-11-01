import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRole = route.data['role'];
  const userRole = authService.getRole();

  console.log('RoleGuard - Rôle attendu:', expectedRole, 'Rôle utilisateur:', userRole);

  if (userRole === expectedRole) {
    return true;
  } else {
    // Rediriger vers la page appropriée selon le rôle
    switch (userRole) {
      case 'PATIENT':
        router.navigate(['/patient/dashboard']);
        break;
      case 'DOCTEUR':
        router.navigate(['/doctor/dashboard']);
        break;
      case 'ADMIN':
        router.navigate(['/admin/dashboard']);
        break;
      default:
        router.navigate(['/login']);
    }
    return false;
  }
};