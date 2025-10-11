import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    HeaderComponent,
    FooterComponent
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
    // Ne pas montrer le header sur les pages d'authentification et la page d'accueil pour les non-connectés
    const currentRoute = this.router.url;
    const authPages = ['/login', '/signup'];
    
    if (authPages.includes(currentRoute)) {
      return false;
    }
    
    // Sur la page d'accueil, montrer le header seulement si connecté
    if (currentRoute === '/') {
      return this.authService.isLoggedIn();
    }
    
    // Sur les autres pages, montrer le header si connecté
    return this.authService.isLoggedIn();
  }

  shouldShowFooter(): boolean {
    // Montrer le footer seulement sur la page d'accueil pour les non-connectés
    const currentRoute = this.router.url;
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
}