import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes qui nécessitent une authentification
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est authentifié
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si non authentifié, rediriger vers /login
  router.navigate(['/login']);
  return false;
};
