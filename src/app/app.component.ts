import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'DocTime - Plateforme intelligente de gestion des rendez-vous médicaux';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  shouldShowHeader(): boolean {
    const currentRoute = this.router.url;
    const authPages = ['/login', '/signup'];
    
    // Ne pas montrer le header sur les pages d'authentification
    if (authPages.includes(currentRoute)) {
      return false;
    }
    
    return true; // Montrer le header sur toutes les autres pages
  }

  shouldShowAuthButtons(): boolean {
    const currentRoute = this.router.url;
    return currentRoute === '/'; // Montrer les boutons auth seulement sur la page d'accueil
  }

  shouldShowFooter(): boolean {
    const currentRoute = this.router.url;
    // Montrer le footer seulement sur la page d'accueil pour les non-connectés
    return currentRoute === '/' && !this.authService.isLoggedIn();
  }

  getMainContentClass(): string {
    const classes = [];
    
    if (this.shouldShowHeader()) {
      classes.push('with-header');
    }
    
    if (this.shouldShowFooter()) {
      classes.push('with-footer');
    }
    
    return classes.join(' ');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}