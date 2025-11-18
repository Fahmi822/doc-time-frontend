import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DoctorService, Specialite } from '../../../services/doctor.service';

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
  specialites: Specialite[] = [];

  roles = [
    { value: 'PATIENT', label: 'Patient', description: 'Prendre rendez-vous avec des médecins' },
    { value: 'DOCTEUR', label: 'Médecin', description: 'Gérer votre cabinet et vos rendez-vous' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private doctorService: DoctorService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      // Champs spécifiques docteur
      specialiteId: [''],
      numeroLicence: [''],
      anneesExperience: [''],
      tarifConsultation: [''],
      langue: ['fr'],
      telephone: [''],
      adresse: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadSpecialites();
    // Initialiser les validateurs selon le rôle par défaut
    this.onRoleChange(this.selectedRole);
  }

  loadSpecialites() {
    this.doctorService.getSpecialites().subscribe({
      next: (specialites) => {
        this.specialites = specialites;
        console.log('Spécialités chargées:', this.specialites);
      },
      error: (error) => {
        console.error('Erreur chargement spécialités:', error);
        // Fallback en cas d'erreur
        this.specialites = this.getSpecialitesParDefaut();
      }
    });
  }

  private getSpecialitesParDefaut(): Specialite[] {
    return [
      { id: 1, titre: 'Cardiologie', description: 'Spécialiste des maladies du cœur' },
      { id: 2, titre: 'Dermatologie', description: 'Spécialiste des maladies de la peau' },
      { id: 3, titre: 'Pédiatrie', description: 'Spécialiste des enfants' },
      { id: 4, titre: 'Gynécologie', description: 'Spécialiste de la santé féminine' },
      { id: 5, titre: 'Neurologie', description: 'Spécialiste des maladies neurologiques' }
    ];
  }

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('motDePasse');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onRoleSelect(role: string): void {
    this.selectedRole = role;
    this.onRoleChange(role);
  }

  onRoleChange(role: string): void {
    console.log('Changement de rôle:', role);
    
    // Réinitialiser les validators selon le rôle
    const specialiteId = this.signupForm.get('specialiteId');
    const numeroLicence = this.signupForm.get('numeroLicence');
    const anneesExperience = this.signupForm.get('anneesExperience');
    const tarifConsultation = this.signupForm.get('tarifConsultation');

    if (role === 'DOCTEUR') {
      // Ajouter les validateurs pour les docteurs
      specialiteId?.setValidators([Validators.required]);
      numeroLicence?.setValidators([Validators.required]);
      anneesExperience?.setValidators([Validators.required, Validators.min(0)]);
      tarifConsultation?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      // Supprimer les validateurs pour les patients
      specialiteId?.clearValidators();
      numeroLicence?.clearValidators();
      anneesExperience?.clearValidators();
      tarifConsultation?.clearValidators();

      // Réinitialiser les valeurs
      specialiteId?.setValue('');
      numeroLicence?.setValue('');
      anneesExperience?.setValue('');
      tarifConsultation?.setValue('');
    }

    // Mettre à jour la validation
    specialiteId?.updateValueAndValidity();
    numeroLicence?.updateValueAndValidity();
    anneesExperience?.updateValueAndValidity();
    tarifConsultation?.updateValueAndValidity();
  }

  onSubmit(): void {
    console.log('Soumission du formulaire', this.signupForm.value);
    console.log('Rôle sélectionné:', this.selectedRole);
    console.log('Formulaire valide:', this.signupForm.valid);

    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.markAllFieldsAsTouched();

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

      console.log('Données envoyées:', userData);

      // Pour les docteurs, convertir les nombres et nettoyer les données
      if (this.selectedRole === 'DOCTEUR') {
        userData.anneesExperience = userData.anneesExperience ? parseInt(userData.anneesExperience) : 0;
        userData.tarifConsultation = userData.tarifConsultation ? parseFloat(userData.tarifConsultation) : 0;
        userData.specialiteId = userData.specialiteId ? parseInt(userData.specialiteId) : null;
        
        console.log('Inscription docteur avec données:', userData);
        
        // Utiliser l'endpoint spécifique pour les docteurs
        this.authService.signupDoctor(userData).subscribe({
          next: (response: any) => {
            this.handleSignupSuccess(response);
          },
          error: (error) => {
            this.handleSignupError(error);
          }
        });
      } else {
        // Pour les patients, utiliser l'endpoint normal
        console.log('Inscription patient avec données:', userData);
        
        this.authService.signup(userData).subscribe({
          next: (response: any) => {
            this.handleSignupSuccess(response);
          },
          error: (error) => {
            this.handleSignupError(error);
          }
        });
      }
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      console.log('Erreurs de validation:', this.getFormValidationErrors());
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
    });
  }

  private getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  private handleSignupSuccess(response: any): void {
    console.log('Réponse inscription réussie:', response);
    this.successMessage = typeof response === 'string' ? response : 'Inscription réussie !';
    this.isLoading = false;
    
    // Redirection après 2 secondes
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  private handleSignupError(error: any): void {
    console.error('Erreur inscription:', error);
    this.isLoading = false;
    
    if (error.error) {
      this.errorMessage = typeof error.error === 'string' ? error.error : 'Erreur lors de l\'inscription';
    } else {
      this.errorMessage = 'Erreur de connexion au serveur';
    }
  }

  // Helper pour vérifier si le rôle est docteur
  isDoctorRole(): boolean {
    return this.selectedRole === 'DOCTEUR';
  }

  // Helper pour afficher l'état de validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}