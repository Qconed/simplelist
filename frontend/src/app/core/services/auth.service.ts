import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  JwtPayload
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  
  // Signal pour stocker l'utilisateur courant
  currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialiser l'utilisateur au démarrage si un token existe
    this.initializeUser();
  }

  /**
   * Initialise l'utilisateur depuis le token localStorage
   */
  private initializeUser(): void {
    const token = this.getToken();
    if (token && this.isTokenValid(token)) {
      const user = this.getUserFromToken(token);
      this.currentUser.set(user);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/auth/register
   */
  register(email: string, username: string, password: string): Observable<AuthResponse> {
    const body: RegisterRequest = { email, username, password };
    
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/register`, body)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  /**
   * Connexion d'un utilisateur
   * POST /api/auth/login
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { email, password };
    
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/login`, body)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid(token);
  }

  /**
   * Récupère le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Récupère l'utilisateur courant depuis le JWT
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Gère le succès de l'authentification (login ou register)
   */
  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    this.currentUser.set(response.user);
  }

  /**
   * Vérifie si le token est valide (non expiré)
   */
  private isTokenValid(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.exp) {
        const expirationDate = new Date(decoded.exp * 1000);
        return expirationDate > new Date();
      }
      return true; // Si pas d'expiration, on considère valide
    } catch (error) {
      return false;
    }
  }

  /**
   * Extrait l'utilisateur depuis le token JWT
   */
  private getUserFromToken(token: string): User {
    const decoded = jwtDecode<JwtPayload>(token);
    return {
      email: decoded.email,
      username: decoded.username
    };
  }
}