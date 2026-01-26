// Interface User (données dans le JWT et réponses API)
export interface User {
  email: string;
  username: string;
}

// Request pour l'inscription (POST /api/auth/register)
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

// Request pour la connexion (POST /api/auth/login)
export interface LoginRequest {
  email: string;
  password: string;
}

// Response de l'API auth (login et register)
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Payload décodé du JWT
export interface JwtPayload {
  email: string;
  username: string;
  iat?: number;  // Issued at
  exp?: number;  // Expiration
}