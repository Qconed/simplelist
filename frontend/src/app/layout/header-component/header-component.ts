import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header-component',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  // Signal computé pour savoir si l'utilisateur est connecté
  isLoggedIn = computed(() => this.authService.currentUser() !== null);
  
  // Signal computé pour récupérer l'utilisateur actuel
  currentUser = computed(() => this.authService.currentUser());

  constructor(public authService: AuthService) {}

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this.authService.logout();
  }
}
