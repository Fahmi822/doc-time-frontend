import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
  currentRoute: string = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Surveiller les changements de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  shouldShowHeader(): boolean {
    // Pages où le header NE DOIT PAS s'afficher
    const noHeaderRoutes = [
      '/login', 
      '/signup',
      '/doctor/dashboard',
      '/patient/dashboard',
      '/admin/dashboard'
    ];
    
    // Vérifier si la route actuelle commence par un des chemins à exclure
    return !noHeaderRoutes.some(route => this.currentRoute.startsWith(route));
  }

  shouldShowAuthButtons(): boolean {
    // Montrer les boutons d'authentification seulement sur la page d'accueil pour les non-connectés
    return this.currentRoute === '/' && !this.authService.isLoggedIn();
  }

  shouldShowFooter(): boolean {
    // Pages où le footer NE DOIT PAS s'afficher
    const noFooterRoutes = [
      '/login',
      '/signup', 
      '/doctor/dashboard',
      '/patient/dashboard',
      '/admin/dashboard'
    ];
    
    // Montrer le footer seulement sur la page d'accueil pour les non-connectés
    return this.currentRoute === '/' && !this.authService.isLoggedIn() && 
           !noFooterRoutes.some(route => this.currentRoute.startsWith(route));
  }

  getMainContentClass(): string {
    const classes = [];
    
    if (this.shouldShowHeader()) {
      classes.push('with-header');
    }
    
    if (this.shouldShowFooter()) {
      classes.push('with-footer');
    }
    
    // Ajouter une classe basée sur le rôle pour le styling
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getRole();
      if (role) {
        classes.push(role.toLowerCase());
      }
    }
    
    return classes.join(' ');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToHome(): void {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getRole();
      switch(role) {
        case 'DOCTOR':
          this.router.navigate(['/doctor/dashboard']);
          break;
        case 'PATIENT':
          this.router.navigate(['/patient/dashboard']);
          break;
        case 'ADMIN':
          this.router.navigate(['/admin/dashboard']);
          break;
        default:
          this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  // Méthode pour obtenir le texte d'accueil personnalisé
  getWelcomeText(): string {
    if (!this.authService.isLoggedIn()) return '';
    
    const role = this.authService.getRole();
    //const userName = this.authService.getUserName(); // À implémenter dans AuthService
    
    switch(role) {
      case 'DOCTOR':
       // return `Dr. ${userName || ''}`;
      case 'PATIENT':
       // return `${userName || 'Patient'}`;
      case 'ADMIN':
        return `Administrateur`;
      default:
        return 'Utilisateur';
    }
  }
}