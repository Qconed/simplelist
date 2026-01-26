import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Intercepteur HTTP pour gérer l'authentification basée sur les cookies
 * - Ajoute automatiquement `withCredentials: true` à toutes les requêtes
 *   pour permettre l'envoi des cookies HTTP-only
 * - Gère les erreurs 401 (non autorisé) en redirigeant vers /login
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Cloner la requête pour ajouter withCredentials: true
  // Cela permet d'envoyer les cookies cross-origin
  const clonedRequest = req.clone({
    withCredentials: true
  });

  return next(clonedRequest).pipe(
    catchError((error) => {
      // Si erreur 401 (non authentifié), rediriger vers la page de login
      if (error.status === 401) {
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};
