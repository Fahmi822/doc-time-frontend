import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  selectedRole = 'PATIENT';

  roles = [
    { value: 'PATIENT', label: 'Patient', description: 'Prendre rendez-vous avec des médecins' },
    { value: 'DOCTEUR', label: 'Médecin', description: 'Gérer votre cabinet et vos rendez-vous' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('motDePasse');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
    return null;
  }

  onRoleSelect(role: string): void {
    this.selectedRole = role;
  }

  onSubmit(): void {
  if (this.signupForm.valid && this.selectedRole) {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData = {
      ...this.signupForm.value,
      role: this.selectedRole
    };

    delete userData.confirmPassword;

    this.authService.signup(userData).subscribe({
      next: (response: any) => {
        console.log('Réponse inscription:', response);
        this.successMessage = typeof response === 'string' ? response : 'Inscription réussie !';
        this.isLoading = false;
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur détaillée inscription:', error);
        
        // Gestion détaillée des erreurs
        if (error.error) {
          // Si l'erreur est une string
          if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } 
          // Si l'erreur est un objet avec une propriété message
          else if (error.error.message) {
            this.errorMessage = error.error.message;
          }
          // Si l'erreur est un objet avec une propriété error
          else if (error.error.error) {
            this.errorMessage = error.error.error;
          }
          // Autre format
          else {
            this.errorMessage = 'Erreur lors de l\'inscription';
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Erreur inconnue lors de l\'inscription';
        }
        
        this.isLoading = false;
      }
    });
  }
}
}