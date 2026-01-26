import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register-component',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Création du formulaire avec validation
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  /**
   * Soumission du formulaire d'inscription
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.errorMessage.set('Veuillez remplir correctement tous les champs');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, email, password } = this.registerForm.value;

    this.authService.register(email, username, password).subscribe({
      next: (response) => {
        console.log('Inscription réussie:', response);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erreur d\'inscription:', error);
        this.isLoading.set(false);
        
        if (error.status === 409) {
          this.errorMessage.set('Un utilisateur avec cet email existe déjà');
        } else if (error.error?.error) {
          this.errorMessage.set(error.error.error);
        } else {
          this.errorMessage.set('Erreur lors de l\'inscription. Veuillez réessayer.');
        }
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Getters pour accéder facilement aux contrôles du formulaire
   */
  get username() {
    return this.registerForm.get('username');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}
