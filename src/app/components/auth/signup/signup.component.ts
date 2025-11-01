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
      confirmPassword?.setErrors({ passwordMismatch: true });
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

      // Supprimer le champ de confirmation
      delete userData.confirmPassword;

      this.authService.signup(userData).subscribe({
        next: (response: any) => {
          console.log('Réponse inscription:', response);
          this.successMessage = typeof response === 'string' ? response : 'Inscription réussie !';
          this.isLoading = false;
          
          // Redirection après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.error('Erreur inscription:', error);
          this.isLoading = false;
          
          if (error.error) {
            this.errorMessage = typeof error.error === 'string' ? error.error : 'Erreur lors de l\'inscription';
          } else {
            this.errorMessage = 'Erreur de connexion au serveur';
          }
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs et sélectionner un rôle';
    }
  }
}