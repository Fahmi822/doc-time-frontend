import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
  if (this.loginForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login réussi:', response);
        this.isLoading = false;
        
        // VÉRIFICATION AVANT REDIRECTION
        if (response && response.role) {
          this.redirectBasedOnRole(response.role);
        } else {
          // Si pas de rôle dans la réponse, essayer de récupérer depuis le token ou le localStorage
          const role = this.authService.getRole();
          if (role) {
            console.log('🔄 Rôle récupéré depuis AuthService:', role);
            this.redirectBasedOnRole(role);
          } else {
            this.errorMessage = 'Erreur: informations utilisateur manquantes';
            console.error('Données manquantes:', response);
          }
        }
      },
      error: (error) => {
        console.error('Erreur login:', error);
        this.isLoading = false;
        
        if (error.error) {
          if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Email ou mot de passe incorrect';
          }
        } else {
          this.errorMessage = 'Erreur de connexion au serveur';
        }
      }
    });
  } else {
    this.errorMessage = 'Veuillez remplir tous les champs correctement';
  }
}

private redirectBasedOnRole(role: string | undefined): void {
  if (!role) {
    console.error('❌ Rôle non défini pour la redirection');
    this.router.navigate(['/']);
    return;
  }
  
  console.log('🔀 Redirection basée sur rôle:', role);
  
  const normalizedRole = role.toUpperCase();
  
  switch (normalizedRole) {
    case 'PATIENT':
      console.log('➡️ Redirection vers dashboard patient');
      this.router.navigate(['/patient/dashboard']);
      break;
    case 'DOCTEUR':
      console.log('➡️ Redirection vers dashboard docteur');
      this.router.navigate(['/doctor/dashboard']);
      break;
    case 'ADMIN':
      console.log('➡️ Redirection vers dashboard admin');
      this.router.navigate(['/admin/dashboard']);
      break;
    default:
      console.warn('⚠️ Rôle non reconnu:', normalizedRole, 'redirection vers accueil');
      this.router.navigate(['/']);
  }
}
}