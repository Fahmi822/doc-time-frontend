import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService, Docteur, CreateRendezVousRequest } from '../../services/patient.service';
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

  disponibiliteError: string = '';
  creneauxSuggerees: string[] = [];

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

    // Détection du changement de date pour générer les créneaux correspondants
    this.rendezVousForm.get('date')?.valueChanges.subscribe((selectedDate) => {
      if (selectedDate && this.selectedDocteur) {
        this.genererAvailableSlotsPourDate(selectedDate);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['docteurId']) {
        this.selectedDocteurId = +params['docteurId'];
        this.prendreRendezVousAvecDocteur(this.selectedDocteurId);
      }
    });
  }

  onDocteurSelect(docteur: Docteur): void {
    this.selectedDocteur = docteur;
    this.rendezVousForm.patchValue({ docteurId: docteur.id });
    this.availableSlots = []; // Réinitialise avant la date
    this.disponibiliteError = '';
    this.creneauxSuggerees = [];
  }

  async genererAvailableSlotsPourDate(dateChoisie: string): Promise<void> {
    if (!this.selectedDocteur) return;

    try {
      const dateDebut = new Date(dateChoisie);
      const dateFin = new Date(dateChoisie);
      dateFin.setHours(23, 59, 59, 999);

      const creneaux = await this.patientService
        .getCreneauxDisponibles(this.selectedDocteur.id, dateDebut.toISOString(), dateFin.toISOString())
        .toPromise();

      this.availableSlots = (creneaux && creneaux.length > 0)
        ? this.formaterCreneaux(creneaux)
        : this.genererSlotsParDefaut();
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
      this.availableSlots = this.genererSlotsParDefaut();
    }
  }

  formaterCreneaux(creneaux: string[]): string[] {
    return creneaux.map(creneau => {
      const date = new Date(creneau);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    });
  }

  genererSlotsParDefaut(): string[] {
    return [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
  }

  async onSubmit(): Promise<void> {
    if (this.rendezVousForm.valid && this.patientId) {
      this.isLoading = true;
      this.disponibiliteError = '';
      this.creneauxSuggerees = [];

      const formValue = this.rendezVousForm.value;
      const dateTime = new Date(formValue.date + 'T' + formValue.heure);

      try {
        const estDisponible = await this.patientService
          .verifierDisponibilite(formValue.docteurId, dateTime.toISOString())
          .toPromise();

        if (!estDisponible) {
          this.disponibiliteError = 'Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.';
          this.suggereNouveauxCreneaux(formValue.docteurId, dateTime);
          this.isLoading = false;
          return;
        }

        const request: CreateRendezVousRequest = {
          dateHeure: dateTime.toISOString(),
          motif: formValue.motif,
          patientId: this.patientId,
          docteurId: formValue.docteurId
        };

        this.patientService.prendreRendezVous(request).subscribe({
          next: () => {
            this.isLoading = false;
            
            // Message de succès avec option de retour
            if (confirm('Rendez-vous créé avec succès ! Souhaitez-vous retourner à votre tableau de bord ?')) {
              this.router.navigate(['/patient/dashboard']);
            } else {
              // Réinitialiser le formulaire pour un nouveau rendez-vous
              this.rendezVousForm.reset();
              this.selectedDocteur = null;
              this.availableSlots = [];
            }
          },
          error: (error) => {
            this.isLoading = false;
            alert('Erreur: ' + (error.error || 'Erreur lors de la création du rendez-vous'));
          }
        });

      } catch (error) {
        this.isLoading = false;
        this.disponibiliteError = 'Erreur de vérification de disponibilité';
      }
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  async suggereNouveauxCreneaux(docteurId: number, dateTimeOriginal: Date): Promise<void> {
    try {
      const dateDebut = new Date(dateTimeOriginal);
      dateDebut.setHours(0, 0, 0, 0);

      const dateFin = new Date(dateTimeOriginal);
      dateFin.setDate(dateFin.getDate() + 1);

      const creneaux = await this.patientService
        .getCreneauxDisponibles(docteurId, dateDebut.toISOString(), dateFin.toISOString())
        .toPromise();

      this.creneauxSuggerees = this.formaterCreneaux(creneaux || []);
    } catch (error) {
      console.error('Erreur suggestion créneaux:', error);
    }
  }

  utiliserCreneauSuggere(creneau: string): void {
    this.rendezVousForm.patchValue({ heure: creneau });
    this.disponibiliteError = '';
    this.creneauxSuggerees = [];
  }

  loadDocteurs(): void {
    this.patientService.getAllDocteurs().subscribe({
      next: (docteurs) => {
        this.docteurs = docteurs;
        this.filteredDocteurs = docteurs;
      },
      error: (error) => console.error('Erreur chargement docteurs:', error)
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

  prendreRendezVousAvecDocteur(docteurId: number): void {
    const docteur = this.docteurs.find(d => d.id === docteurId);
    if (docteur) {
      this.onDocteurSelect(docteur);
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