import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  
  // Signal pour stocker l'utilisateur courant
  currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Vérifier l'authentification au démarrage depuis le cookie
    this.checkAuth().subscribe();
  }

  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/auth/register
   */
  register(email: string, username: string, password: string): Observable<AuthResponse> {
    const body: RegisterRequest = { email, username, password };
    
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/register`, body, {
      withCredentials: true  // Permet l'envoi et la réception des cookies
    }).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  /**
   * Connexion d'un utilisateur
   * POST /api/auth/login
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { email, password };
    
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/login`, body, {
      withCredentials: true  // Permet l'envoi et la réception des cookies
    }).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  /**
   * Déconnexion
   * Appelle le backend pour supprimer le cookie
   */
  logout(): void {
    this.http.post(`${this.API_URL}/api/auth/logout`, {}, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        // Même en cas d'erreur, on déconnecte l'utilisateur côté client
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Vérifie si l'utilisateur est authentifié en appelant /api/auth/me
   * Retourne true si authentifié, false sinon
   */
  checkAuth(): Observable<boolean> {
    return this.http.get<{ user: User }>(`${this.API_URL}/api/auth/me`, {
      withCredentials: true
    }).pipe(
      tap(response => this.currentUser.set(response.user)),
      map(() => true),  // Transformer en true si succès
      catchError(() => {
        this.currentUser.set(null);
        return of(false);
      })
    );
  }

  /**
   * Vérifie si l'utilisateur est authentifié (version synchrone)
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Récupère l'utilisateur courant
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Gère le succès de l'authentification (login ou register)
   * Plus besoin de stocker le token, il est dans un cookie HTTP-only
   */
  private handleAuthSuccess(response: AuthResponse): void {
    this.currentUser.set(response.user);
  }
}