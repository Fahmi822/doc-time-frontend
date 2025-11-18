import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService, RendezVous, Disponibilite, CreateDisponibiliteRequest, DisponibiliteRequest, Docteur, UpdateDocteurRequest, Specialite, StatistiquesDocteur, Patient } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';
export enum DashboardTabs {
  AUJOURDHUI = 'aujourdhui',
  TOUS = 'tous',
  DISPONIBILITES = 'disponibilites',
  PATIENTS = 'patients'
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  // Données
  rendezVous: RendezVous[] = [];
  rendezVousAujourdhui: RendezVous[] = [];
  disponibilites: Disponibilite[] = [];
  patients: Patient[] = [];
  activeTab: DashboardTabs = DashboardTabs.AUJOURDHUI;
  readonly DashboardTabs = DashboardTabs;
  
  // États
  isLoading: boolean = false;
  docteurId: number | null = null;
  
  // Propriétés pour les dates
  todayDate: string = '';
  minDate: string = '';
  lundiProchain: Date = new Date();
  
  // Statistiques
  statistiques: StatistiquesDocteur = {
    totalRendezVous: 0,
    rendezVousConfirmes: 0,
    nouveauxPatients: 0,
    revenuMensuel: 0,
    tauxOccupation: 0,
    noteMoyenne: 0
  };

  // Propriétés pour les modales
  showModalDisponibilite: boolean = false;
  showModalGenererSemaine: boolean = false;
  showModalProfil: boolean = false;
  showProfileMenu: boolean = false;

  nouvelleDisponibilite: any = {
    dateDebut: '',
    heureDebut: '09:00',
    dateFin: '',
    heureFin: '18:00',
    type: 'disponible',
    motif: ''
  };

  // Propriétés pour la gestion du profil
  monProfil: Docteur | null = null;
  specialites: Specialite[] = [];
  photoFile: File | null = null;
  photoPreview: string | null = null;
  
  // Formulaire de profil
  profilForm: UpdateDocteurRequest = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    specialiteId: undefined,
    numeroLicence: '',
    anneesExperience: undefined,
    tarifConsultation: undefined,
    langue: 'fr'
  };

  // Gestion des erreurs
  errorMessage: string = '';
  hasConnectionError: boolean = false;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isDoctor()) {
      this.showError('Accès réservé aux docteurs');
      this.router.navigate(['/login']);
      return;
    }

    this.docteurId = this.authService.getUserId();
    
    if (!this.docteurId) {
      this.showError('Erreur: Docteur non connecté');
      this.router.navigate(['/login']);
      return;
    }

    this.initializeDates();
    this.loadDonnees();
    this.loadMonProfil();
    this.loadSpecialites();
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.hasConnectionError = true;
    console.error('🔴', message);
  }

  private clearError(): void {
    this.errorMessage = '';
    this.hasConnectionError = false;
  }

  retryLoad(): void {
    this.clearError();
    this.loadDonnees();
    this.loadMonProfil();
    this.loadSpecialites();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  @HostListener('document:click', ['$event'])
  fermerProfileMenuExterne(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu')) {
      this.showProfileMenu = false;
    }
  }

  private initializeDates(): void {
    const today = new Date();
    this.todayDate = this.getDateFormatee(today.toISOString());
    this.minDate = this.formatDateForInput(today);
    this.lundiProchain = this.getLundiProchain();
  }

  loadDonnees(): void {
    if (!this.docteurId) return;

    this.isLoading = true;
    this.clearError();

    // Charger les rendez-vous d'aujourd'hui
    const aujourdhui = new Date().toISOString().split('T')[0];
    this.doctorService.getRendezVousParDate(this.docteurId, aujourdhui).subscribe({
      next: (data) => {
        this.rendezVousAujourdhui = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement rendez-vous aujourd\'hui:', error);
        this.showError('Erreur de chargement des rendez-vous');
        this.isLoading = false;
      }
    });

    // Charger tous les rendez-vous
    this.doctorService.getMesRendezVous(this.docteurId).subscribe({
      next: (data) => {
        this.rendezVous = data;
        this.calculerStatistiquesParDefaut();
      },
      error: (error) => {
        console.error('Erreur chargement rendez-vous:', error);
        this.showError('Erreur de chargement des rendez-vous');
      }
    });

    // Charger les disponibilités
    this.doctorService.getMesDisponibilites(this.docteurId).subscribe({
      next: (data) => {
        this.disponibilites = data;
      },
      error: (error) => {
        console.error('Erreur chargement disponibilités:', error);
        this.showError('Erreur de chargement des disponibilités');
      }
    });

    // Charger les patients
    this.doctorService.getMesPatients(this.docteurId).subscribe({
      next: (data) => {
        this.patients = data;
      },
      error: (error) => {
        console.error('Erreur chargement patients:', error);
      }
    });

    // Charger les statistiques
    this.doctorService.getStatistiquesDocteur(this.docteurId).subscribe({
      next: (data) => {
        this.statistiques = data;
      },
      error: (error) => {
        console.error('Erreur chargement statistiques:', error);
        this.showError('Erreur de chargement des statistiques');
        this.calculerStatistiquesParDefaut();
      }
    });
  }

  private calculerStatistiquesParDefaut(): void {
    const patientsUniques = this.getPatientsUniques();
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    
    const rdvCeMois = this.rendezVous.filter(rdv => 
      new Date(rdv.dateHeure) >= debutMois
    );

    this.statistiques = {
      totalRendezVous: rdvCeMois.length,
      rendezVousConfirmes: rdvCeMois.filter(r => r.statut === 'CONFIRME').length,
      nouveauxPatients: patientsUniques.length,
      revenuMensuel: rdvCeMois.filter(r => r.statut === 'TERMINE').length * (this.monProfil?.tarifConsultation || 50),
      tauxOccupation: Math.round((rdvCeMois.length / 20) * 100), // Estimation
      noteMoyenne: this.monProfil?.noteMoyenne || 0
    };
  }

  loadSpecialites(): void {
    this.doctorService.getSpecialites().subscribe({
      next: (specialites) => {
        this.specialites = specialites;
      },
      error: (error) => {
        console.error('❌ Erreur chargement spécialités:', error);
        this.specialites = this.getSpecialitesParDefaut();
      }
    });
  }

  private getSpecialitesParDefaut(): Specialite[] {
    return [
      { id: 1, titre: 'Cardiologie', description: 'Spécialiste des maladies du cœur' },
      { id: 2, titre: 'Dermatologie', description: 'Spécialiste des maladies de la peau' },
      { id: 3, titre: 'Pédiatrie', description: 'Spécialiste des enfants' },
      { id: 4, titre: 'Gynécologie', description: 'Spécialiste de la santé féminine' }
    ];
  }

  setActiveTab(tab: DashboardTabs): void {
    this.activeTab = tab;
    
    if (tab === DashboardTabs.PATIENTS && this.patients.length === 0) {
      this.loadPatients();
    }
  }

  loadPatients(): void {
    if (!this.docteurId) return;

    this.doctorService.getMesPatients(this.docteurId).subscribe({
      next: (data) => {
        this.patients = data;
      },
      error: (error) => {
        console.error('Erreur chargement patients:', error);
      }
    });
  }

  terminerRendezVous(rendezVousId: number): void {
    this.doctorService.terminerRendezVous(rendezVousId).subscribe({
      next: () => {
        this.loadDonnees();
        alert('Rendez-vous marqué comme terminé');
      },
      error: (error) => {
        alert('Erreur: ' + error.message);
      }
    });
  }

  ouvrirModalNotes(rdv: RendezVous): void {
    const notes = prompt('Ajouter des notes pour ce rendez-vous:', rdv.notes || '');
    if (notes !== null) {
      // Note: Le service DoctorService n'a pas de méthode pour ajouter des notes
      // Implémentez cette fonctionnalité si nécessaire
      alert('Fonctionnalité d\'ajout de notes à implémenter');
    }
  }

  ouvrirModalDisponibilite(): void {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);

    this.nouvelleDisponibilite = {
      dateDebut: this.formatDateForInput(demain),
      heureDebut: '09:00',
      dateFin: this.formatDateForInput(demain),
      heureFin: '18:00',
      type: 'disponible',
      motif: ''
    };

    this.showModalDisponibilite = true;
  }

  fermerModalDisponibilite(): void {
    this.showModalDisponibilite = false;
    this.showModalGenererSemaine = false;
  }

  ajouterDisponibilite(): void {
    if (!this.docteurId) return;

    const dateHeureDebut = new Date(`${this.nouvelleDisponibilite.dateDebut}T${this.nouvelleDisponibilite.heureDebut}`);
    const dateHeureFin = new Date(`${this.nouvelleDisponibilite.dateFin}T${this.nouvelleDisponibilite.heureFin}`);

    if (dateHeureDebut >= dateHeureFin) {
      alert('La date/heure de fin doit être après la date/heure de début');
      return;
    }

    if (this.nouvelleDisponibilite.type === 'disponible') {
      const request: CreateDisponibiliteRequest = {
        dateHeureDebut: dateHeureDebut.toISOString(),
        dateHeureFin: dateHeureFin.toISOString(),
        docteurId: this.docteurId
      };

      this.doctorService.ajouterDisponibilite(request).subscribe({
        next: () => {
          this.loadDonnees();
          this.fermerModalDisponibilite();
          alert('Disponibilité ajoutée avec succès');
        },
        error: (error) => {
          alert('Erreur: ' + error.message);
        }
      });
    } else {
      const request: DisponibiliteRequest = {
        dateHeureDebut: dateHeureDebut.toISOString(),
        dateHeureFin: dateHeureFin.toISOString(),
        docteurId: this.docteurId,
        motifIndisponibilite: this.nouvelleDisponibilite.motif
      };

      this.doctorService.ajouterIndisponibilite(request).subscribe({
        next: () => {
          this.loadDonnees();
          this.fermerModalDisponibilite();
          alert('Indisponibilité ajoutée avec succès');
        },
        error: (error) => {
          alert('Erreur: ' + error.message);
        }
      });
    }
  }

  ouvrirModalGenererSemaine(): void {
    this.showModalGenererSemaine = true;
  }

  genererSemaineDisponibilites(): void {
    // Note: Le service DoctorService n'a pas de méthode genererDisponibilitesSemaine
    // Implémentez cette fonctionnalité si nécessaire
    alert('Fonctionnalité de génération de semaine à implémenter');
    this.fermerModalDisponibilite();
  }

  supprimerDisponibilite(disponibiliteId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      this.doctorService.supprimerDisponibilite(disponibiliteId).subscribe({
        next: () => {
          this.loadDonnees();
          alert('Disponibilité supprimée avec succès');
        },
        error: (error) => {
          alert('Erreur lors de la suppression: ' + error.message);
        }
      });
    }
  }

  loadMonProfil(): void {
    if (!this.docteurId) return;
    
    this.doctorService.getMonProfil(this.docteurId).subscribe({
      next: (profil) => {
        this.monProfil = profil;
        this.initializeProfilForm(profil);
      },
      error: (error) => {
        console.error('Erreur chargement profil:', error);
      }
    });
  }

  private initializeProfilForm(profil: Docteur): void {
    this.profilForm = {
      nom: profil.nom || '',
      prenom: profil.prenom || '',
      telephone: profil.telephone || '',
      adresse: profil.adresse || '',
      specialiteId: profil.specialite?.id,
      numeroLicence: profil.numeroLicence || '',
      anneesExperience: profil.anneesExperience,
      tarifConsultation: profil.tarifConsultation,
      langue: profil.langue || 'fr'
    };

    if (profil.photo) {
      this.photoPreview = this.getPhotoUrl(profil.photo);
    }
  }

  ouvrirModalProfil(): void {
    this.showModalProfil = true;
    this.showProfileMenu = false;
  }

  fermerModalProfil(): void {
    this.showModalProfil = false;
    this.photoFile = null;
    this.photoPreview = this.monProfil?.photo ? this.getPhotoUrl(this.monProfil.photo) : null;
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      this.photoFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  supprimerPhoto(): void {
    this.photoFile = null;
    this.photoPreview = null;
  }

  mettreAJourProfil(): void {
    if (!this.docteurId || !this.validerProfil()) return;

    const request: UpdateDocteurRequest = {
      nom: this.profilForm.nom,
      prenom: this.profilForm.prenom,
      telephone: this.profilForm.telephone,
      adresse: this.profilForm.adresse,
      specialiteId: this.profilForm.specialiteId,
      numeroLicence: this.profilForm.numeroLicence,
      anneesExperience: this.profilForm.anneesExperience,
      tarifConsultation: this.profilForm.tarifConsultation,
      langue: this.profilForm.langue
    };

    this.doctorService.updateMonProfil(this.docteurId, request).subscribe({
      next: (profil) => {
        this.monProfil = profil;
        
        if (this.photoFile) {
          this.mettreAJourPhoto();
        } else {
          this.fermerModalProfil();
          alert('Profil mis à jour avec succès');
          this.loadDonnees();
        }
      },
      error: (error) => {
        alert('Erreur lors de la mise à jour du profil: ' + error.message);
      }
    });
  }

  private mettreAJourPhoto(): void {
    if (!this.docteurId || !this.photoFile) return;
    
    this.doctorService.updatePhotoProfil(this.docteurId, this.photoFile).subscribe({
      next: (profil) => {
        this.monProfil = profil;
        this.fermerModalProfil();
        alert('Profil et photo mis à jour avec succès');
        this.loadDonnees();
      },
      error: (error) => {
        alert('Erreur lors de la mise à jour de la photo: ' + error.message);
      }
    });
  }

  private validerProfil(): boolean {
    if (!this.profilForm.nom?.trim()) {
      alert('Le nom est obligatoire');
      return false;
    }

    if (!this.profilForm.prenom?.trim()) {
      alert('Le prénom est obligatoire');
      return false;
    }

    if (!this.profilForm.numeroLicence?.trim()) {
      alert('Le numéro de licence est obligatoire');
      return false;
    }

    if (!this.profilForm.specialiteId) {
      alert('Veuillez sélectionner une spécialité');
      return false;
    }

    if (!this.profilForm.tarifConsultation || this.profilForm.tarifConsultation <= 0) {
      alert('Le tarif de consultation doit être supérieur à 0');
      return false;
    }

    return true;
  }

  // Méthodes utilitaires
  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'PLANIFIE': return 'badge-warning';
      case 'CONFIRME': return 'badge-success';
      case 'ANNULE': return 'badge-danger';
      case 'TERMINE': return 'badge-info';
      case 'ABSENT': return 'badge-dark';
      default: return 'badge-secondary';
    }
  }

  getHeureFromDate(dateHeure: string): string {
    return new Date(dateHeure).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getDateFormatee(dateHeure: string): string {
    return new Date(dateHeure).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  estRendezVousPasse(dateHeure: string): boolean {
    return new Date(dateHeure) < new Date();
  }

  calculerAge(dateNaissance: string): number {
    if (!dateNaissance) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getPatientsUniques(): RendezVous[] {
    const patientsMap = new Map<number, RendezVous>();
    this.rendezVous.forEach(rdv => {
      if (!patientsMap.has(rdv.patient.id)) {
        patientsMap.set(rdv.patient.id, rdv);
      }
    });
    return Array.from(patientsMap.values());
  }

  getDernierRendezVous(patientId: number): string {
    const rdvsPatient = this.rendezVous
      .filter(rdv => rdv.patient.id === patientId)
      .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime());
    
    return rdvsPatient.length > 0 ? rdvsPatient[0].dateHeure : '';
  }

  getPhotoUrl(photoPath: string): string {
  if (!photoPath) {
    return '/assets/default-avatar.png';
  }
  
  // Débogage
  console.log('Original photo path:', photoPath);
  
  // Extraire seulement le nom du fichier
  let fileName = photoPath;
  
  if (photoPath.includes('/')) {
    fileName = photoPath.substring(photoPath.lastIndexOf('/') + 1);
  }
  
  const finalUrl = `${environment.apiPhoto}${fileName}`;
  console.log('Final photo URL:', finalUrl);
  
  return finalUrl;
}
  getSafePhotoUrl(): string {
    if (!this.monProfil?.photo) return 'assets/default-avatar.png';
    return this.getPhotoUrl(this.monProfil.photo);
  }

  onPhotoError(event: any): void {
    console.error('Erreur de chargement de la photo');
    event.target.style.display = 'none';
    const avatarElement = event.target.closest('.profile-avatar');
    const placeholder = avatarElement?.querySelector('.avatar-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  getInitials(): string {
    const prenom = this.monProfil?.prenom || 'D';
    const nom = this.monProfil?.nom || 'R';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }

  genererHeures(): string[] {
    const heures = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const heure = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        heures.push(`${heure}:${minute}`);
      }
    }
    return heures;
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getLundiProchain(): Date {
    const aujourdhui = new Date();
    const jour = aujourdhui.getDay();
    const diff = jour === 0 ? 1 : 8 - jour;
    const lundi = new Date(aujourdhui);
    lundi.setDate(aujourdhui.getDate() + diff);
    lundi.setHours(0, 0, 0, 0);
    return lundi;
  }

  deconnexion(): void {
    this.showProfileMenu = false;
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}