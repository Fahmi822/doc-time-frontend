import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService, Docteur, CreateRendezVousRequest } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';

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
  patientId: number | null = null;

  disponibiliteError: string = '';
  creneauxSuggerees: string[] = [];
  isDirectDocteurSelection: boolean = false;

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

    // Écouter les changements de paramètres d'URL
    this.route.queryParams.subscribe(params => {
      if (params['docteur']) {
        const docteurId = +params['docteur'];
        this.isDirectDocteurSelection = true;
        this.prendreRendezVousAvecDocteur(docteurId);
      } else if (params['docteurId']) {
        const docteurId = +params['docteurId'];
        this.isDirectDocteurSelection = true;
        this.prendreRendezVousAvecDocteur(docteurId);
      }
    });

    // Détection du changement de date
    this.rendezVousForm.get('date')?.valueChanges.subscribe((selectedDate) => {
      if (selectedDate && this.selectedDocteur) {
        this.genererAvailableSlotsPourDate(selectedDate);
      }
    });
  }

  loadDocteurs(): void {
    this.patientService.getAllDocteurs().subscribe({
      next: (docteurs) => {
        this.docteurs = docteurs;
        this.filteredDocteurs = docteurs;
        console.log('Docteurs chargés:', docteurs.length);
        
        // Si on a une sélection directe mais les docteurs viennent d'être chargés
        if (this.isDirectDocteurSelection) {
          const params = this.route.snapshot.queryParams;
          if (params['docteur']) {
            this.prendreRendezVousAvecDocteur(+params['docteur']);
          } else if (params['docteurId']) {
            this.prendreRendezVousAvecDocteur(+params['docteurId']);
          }
        }
      },
      error: (error) => {
        console.error('Erreur chargement docteurs:', error);
        alert('Erreur lors du chargement des docteurs');
      }
    });
  }

  onDocteurSelect(docteur: Docteur): void {
    this.selectedDocteur = docteur;
    this.rendezVousForm.patchValue({ docteurId: docteur.id });
    this.availableSlots = [];
    this.disponibiliteError = '';
    this.creneauxSuggerees = [];

    // Générer les créneaux pour demain par défaut
    const demain = this.getTomorrowDate();
    this.rendezVousForm.patchValue({ date: demain });
    this.genererAvailableSlotsPourDate(demain);
  }

  prendreRendezVousAvecDocteur(docteurId: number): void {
    const docteur = this.docteurs.find(d => d.id === docteurId);
    if (docteur) {
      this.onDocteurSelect(docteur);
      
      // Scroll vers la section date/heure si sélection directe
      if (this.isDirectDocteurSelection) {
        setTimeout(() => {
          const dateTimeSection = document.querySelector('.date-time-section');
          if (dateTimeSection) {
            dateTimeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    } else {
      console.warn('Docteur non trouvé avec ID:', docteurId);
    }
  }

  onDocteurSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredDocteurs = this.docteurs.filter(docteur =>
      docteur.nom.toLowerCase().includes(searchTerm) ||
      docteur.prenom.toLowerCase().includes(searchTerm) ||
      (docteur.specialite?.titre?.toLowerCase().includes(searchTerm) ?? false)
    );
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

      this.availableSlots = creneaux ? this.formaterCreneaux(creneaux) : this.genererSlotsParDefaut();
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
    const slots = [];
    for (let heure = 9; heure <= 18; heure++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (heure === 18 && minute > 0) break;
        const heureStr = heure.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        slots.push(`${heureStr}:${minuteStr}`);
      }
    }
    return slots;
  }

  async onSubmit(): Promise<void> {
    if (this.rendezVousForm.valid && this.patientId && this.selectedDocteur) {
      this.isLoading = true;
      this.disponibiliteError = '';
      this.creneauxSuggerees = [];

      const formValue = this.rendezVousForm.value;
      
      // Créer la date complète
      const dateTime = new Date(formValue.date + 'T' + formValue.heure + ':00');

      try {
        // Vérifier la disponibilité
        const estDisponible = await this.patientService
          .verifierDisponibilite(this.selectedDocteur.id, dateTime.toISOString())
          .toPromise();

        if (!estDisponible) {
          this.disponibiliteError = 'Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.';
          this.suggereNouveauxCreneaux(this.selectedDocteur.id, dateTime);
          this.isLoading = false;
          return;
        }

        const request: CreateRendezVousRequest = {
          dateHeure: dateTime.toISOString(),
          motif: formValue.motif,
          patientId: this.patientId,
          docteurId: this.selectedDocteur.id
        };

        this.patientService.prendreRendezVous(request).subscribe({
          next: (rendezVous) => {
            this.isLoading = false;
            console.log('Rendez-vous créé:', rendezVous);
            
            if (confirm('Rendez-vous créé avec succès ! Souhaitez-vous retourner à votre tableau de bord ?')) {
              this.router.navigate(['/patient/dashboard']);
            } else {
              this.rendezVousForm.reset();
              this.selectedDocteur = null;
              this.availableSlots = [];
              this.isDirectDocteurSelection = false;
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erreur création rendez-vous:', error);
            
            // Gestion des erreurs spécifiques
            if (error.creneauxDisponibles) {
              this.disponibiliteError = error.message;
              this.creneauxSuggerees = this.formaterCreneaux(error.creneauxDisponibles);
            } else {
              alert('Erreur: ' + (error.message || 'Erreur lors de la création du rendez-vous'));
            }
          }
        });

      } catch (error) {
        this.isLoading = false;
        this.disponibiliteError = 'Erreur de vérification de disponibilité';
        console.error('Erreur vérification disponibilité:', error);
      }
    } else {
      alert('Veuillez remplir tous les champs obligatoires et sélectionner un docteur');
    }
  }

  async suggereNouveauxCreneaux(docteurId: number, dateTimeOriginal: Date): Promise<void> {
    try {
      const dateDebut = new Date(dateTimeOriginal);
      dateDebut.setHours(0, 0, 0, 0);

      const dateFin = new Date(dateTimeOriginal);
      dateFin.setDate(dateFin.getDate() + 3); // Suggérer sur 3 jours

      const creneaux = await this.patientService
        .getCreneauxDisponibles(docteurId, dateDebut.toISOString(), dateFin.toISOString())
        .toPromise();

      this.creneauxSuggerees = creneaux ? this.formaterCreneaux(creneaux).slice(0, 6) : [];
    } catch (error) {
      console.error('Erreur suggestion créneaux:', error);
    }
  }

  utiliserCreneauSuggere(creneau: string): void {
    this.rendezVousForm.patchValue({ heure: creneau });
    this.disponibiliteError = '';
    this.creneauxSuggerees = [];
  }

  onCancel(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les informations saisies seront perdues.')) {
      this.router.navigate(['/patient/dashboard']);
    }
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  getPhotoUrl(photoPath: string | undefined): string {
    if (!photoPath) {
      return '/assets/default-avatar.png';
    }
    
    let cleanPath = photoPath;
    
    if (photoPath.startsWith('/api/uploads/')) {
      cleanPath = photoPath.substring('/api/uploads/'.length);
    } else if (photoPath.startsWith('api/uploads/')) {
      cleanPath = photoPath.substring('api/uploads/'.length);
    }
    
    return `${environment.apiPhoto}${cleanPath}`;
  }

  onPhotoError(event: any): void {
    console.error('Erreur de chargement de la photo:', event);
    event.target.src = '/assets/default-avatar.png';
    event.target.onerror = null;
  }

  // Méthode pour formater l'affichage du docteur
  getDocteurDisplayName(docteur: Docteur): string {
    return `Dr. ${docteur.prenom} ${docteur.nom}`;
  }

  // Méthode pour vérifier si le formulaire est prêt
  isFormReady(): boolean {
    return this.rendezVousForm.valid && !!this.selectedDocteur;
  }
}