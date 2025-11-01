import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService, Docteur } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nouveau-rendezvous',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nouveau-rendezvous.component.html',
  styleUrls: ['./nouveau-rendezvous.component.css']
})
export class NouveauRendezVousComponent implements OnInit {
  rendezVousForm: FormGroup;
  docteurs: Docteur[] = [];
  filteredDocteurs: Docteur[] = [];
  selectedDocteur: Docteur | null = null;
  isLoading: boolean = false;
  availableSlots: string[] = [];
  selectedDocteurId: number | null = null;
  patientId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.rendezVousForm = this.fb.group({
      docteurId: ['', Validators.required],
      date: ['', Validators.required],
      heure: ['', Validators.required],
      motif: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.patientId = this.authService.getUserId();
    
    if (!this.patientId) {
      alert('Erreur: Utilisateur non connecté');
      this.router.navigate(['/login']);
      return;
    }

    this.loadDocteurs();
    
    // Vérifier si un docteur est pré-sélectionné via les paramètres de requête
    this.route.queryParams.subscribe(params => {
      if (params['docteurId']) {
        this.selectedDocteurId = +params['docteurId'];
        this.prendreRendezVousAvecDocteur(this.selectedDocteurId);
      }
    });
  }

  loadDocteurs(): void {
    this.patientService.getAllDocteurs().subscribe({
      next: (docteurs) => {
        this.docteurs = docteurs;
        this.filteredDocteurs = docteurs;
      },
      error: (error) => {
        console.error('Erreur chargement docteurs:', error);
      }
    });
  }

  onDocteurSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredDocteurs = this.docteurs.filter(docteur =>
      docteur.nom.toLowerCase().includes(searchTerm) ||
      docteur.prenom.toLowerCase().includes(searchTerm) ||
      (docteur.specialite?.titre?.toLowerCase().includes(searchTerm) ?? false)
    );
  }

  onDocteurSelect(docteur: Docteur): void {
    this.selectedDocteur = docteur;
    this.rendezVousForm.patchValue({ docteurId: docteur.id });
    this.generateAvailableSlots();
  }

  prendreRendezVousAvecDocteur(docteurId: number): void {
    const docteur = this.docteurs.find(d => d.id === docteurId);
    if (docteur) {
      this.onDocteurSelect(docteur);
    }
  }

  generateAvailableSlots(): void {
    // Générer des créneaux disponibles (exemple)
    this.availableSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
  }

  onSubmit(): void {
    if (this.rendezVousForm.valid && this.patientId) {
      this.isLoading = true;
      
      const formValue = this.rendezVousForm.value;
      const dateTime = new Date(formValue.date + 'T' + formValue.heure);

      const request = {
        dateHeure: dateTime.toISOString(),
        motif: formValue.motif,
        patientId: this.patientId,
        docteurId: formValue.docteurId
      };

      this.patientService.prendreRendezVous(request).subscribe({
        next: (response) => {
          this.isLoading = false;
          alert('Rendez-vous créé avec succès !');
          this.router.navigate(['/patient/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          alert('Erreur: ' + (error.error || 'Erreur lors de la création du rendez-vous'));
        }
      });
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  onCancel(): void {
    this.router.navigate(['/patient/dashboard']);
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}