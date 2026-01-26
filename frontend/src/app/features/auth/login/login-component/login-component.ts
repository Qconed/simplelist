import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-component',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Création du formulaire avec validation
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Soumission du formulaire de connexion
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Veuillez remplir correctement tous les champs');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Connexion réussie:', response);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.isLoading.set(false);
        
        if (error.status === 401) {
          this.errorMessage.set('Email ou mot de passe incorrect');
        } else {
          this.errorMessage.set('Erreur de connexion. Veuillez réessayer.');
        }
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Getter pour accéder facilement aux contrôles du formulaire
   */
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
