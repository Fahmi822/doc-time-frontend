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
          this.redirectBasedOnRole(response.role);
        },
        error: (error) => {
          console.error('Erreur login:', error);
          this.isLoading = false;
          
          // Gestion détaillée des erreurs
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

  private redirectBasedOnRole(role: string): void {
    switch (role) {
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
        this.router.navigate(['/']);
    }
  }
}