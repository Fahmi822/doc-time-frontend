import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent {

  features = [
    {
      icon: '⏰',
      title: 'Prise de RDV Simple',
      description: 'Prenez rendez-vous en quelques clics avec nos médecins partenaires'
    },
    {
      icon: '👨‍⚕️',
      title: 'Médecins Qualifiés',
      description: 'Accédez à un réseau de professionnels de santé certifiés'
    },
    {
      icon: '📱',
      title: 'Gestion Mobile',
      description: 'Gérez vos rendez-vous depuis votre smartphone'
    },
    {
      icon: '🔔',
      title: 'Rappels Intelligents',
      description: 'Recevez des rappels par SMS et email'
    }
  ];

  stats = [
    { number: '500+', label: 'Médecins partenaires' },
    { number: '10K+', label: 'Patients satisfaits' },
    { number: '24/7', label: 'Service disponible' },
    { number: '98%', label: 'Taux de satisfaction' }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  onGetStarted(): void {
    if (this.authService.isLoggedIn()) {
      // Rediriger selon le rôle
      const role = this.authService.getRole();
      switch(role) {
        case 'PATIENT':
          this.router.navigate(['/patient/dashboard']);
          break;
        case 'DOCTEUR':
          this.router.navigate(['/doctor/dashboard']);
          break;
        case 'ADMIN':
          this.router.navigate(['/admin/dashboard']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/signup']);
    }
  }

  onLearnMore(): void {
    // Scroll vers la section features
    document.getElementById('features')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }
}