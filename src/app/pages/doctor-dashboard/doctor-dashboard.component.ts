import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService, RendezVous, Disponibilite, CreateDisponibiliteRequest, DisponibiliteRequest, Docteur, UpdateDocteurRequest, Specialite } from '../../services/doctor.service';
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
  // Utiliser l'enum pour les onglets
  activeTab: DashboardTabs = DashboardTabs.AUJOURDHUI;
  
  // Rendre l'enum accessible au template
  readonly DashboardTabs = DashboardTabs;

  
  
  // États
  
  isLoading: boolean = false;
  docteurId: number | null = null;
  
  // Propriétés pour les dates
  todayDate: string = '';
  minDate: string = '';
  lundiProchain: Date = new Date();
  
  // Statistiques
  statistiques: any = {
    totalRendezVous: 0,
    rendezVousConfirmes: 0,
    nouveauxPatients: 0,
    revenuMensuel: 0
  };

  // Propriétés pour les modales
  showModalDisponibilite: boolean = false;
  showModalGenererSemaine: boolean = false;
  showModalProfil: boolean = false;
  
  // Nouvelle propriété pour le menu profil
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
  profilForm: any = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    specialite: '',
    numeroLicence: '',
    anneesExperience: 0,
    tarifConsultation: 0,
    langue: 'fr'
  };

  // Ajoutez ces propriétés pour gérer les erreurs
  errorMessage: string = '';
  hasConnectionError: boolean = false;

  // Rendre environment accessible au template
  environment = environment;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier d'abord si l'utilisateur est un docteur
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

    console.log('🟢 Dashboard chargé pour docteur ID:', this.docteurId);
    console.log('🟢 Token présent:', !!this.authService.getToken());
    console.log('🟢 Role:', this.authService.getRole());

    this.initializeDates();
    this.loadDonnees();
    this.loadMonProfil();
    this.loadSpecialites();
  }

  // ==================== GESTION DES ERREURS ====================

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

  // ==================== GESTION DU MENU PROFIL ====================

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

  // ==================== INITIALISATION ====================

  private initializeDates(): void {
    const today = new Date();
    
    // Date d'aujourd'hui formatée
    this.todayDate = this.getDateFormatee(today.toISOString());
    
    // Date minimale pour les inputs (aujourd'hui)
    this.minDate = this.formatDateForInput(today);
    
    // Lundi prochain
    this.lundiProchain = this.getLundiProchain();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  loadDonnees(): void {
    if (!this.docteurId) return;

    this.isLoading = true;
    this.clearError();

    console.log('📥 Chargement des données...');

    // Charger les rendez-vous d'aujourd'hui
    this.doctorService.getRendezVousAujourdhui(this.docteurId).subscribe({
      next: (data) => {
        this.rendezVousAujourdhui = data;
        console.log('✅ Rendez-vous aujourd\'hui chargés:', data.length);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement rendez-vous:', error);
        this.showError('Erreur de chargement des rendez-vous');
        this.isLoading = false;
      }
    });

    // Charger tous les rendez-vous
    this.doctorService.getMesRendezVous(this.docteurId).subscribe({
      next: (data) => {
        this.rendezVous = data;
        console.log('✅ Tous les rendez-vous chargés:', data.length);
        this.calculerStatistiquesParDefaut();
      },
      error: (error) => {
        console.error('❌ Erreur chargement rendez-vous:', error);
        this.showError('Erreur de chargement des rendez-vous');
      }
    });

    // Charger les disponibilités
    this.doctorService.getMesDisponibilites(this.docteurId).subscribe({
      next: (data) => {
        this.disponibilites = data;
        console.log('✅ Disponibilités chargées:', data.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement disponibilités:', error);
        this.showError('Erreur de chargement des disponibilités');
      }
    });

    // Charger les statistiques
    this.doctorService.getStatistiquesDocteur(this.docteurId).subscribe({
      next: (data) => {
        this.statistiques = data;
        console.log('✅ Statistiques chargées:', data);
      },
      error: (error) => {
        console.error('❌ Erreur chargement statistiques:', error);
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
      revenuMensuel: rdvCeMois.filter(r => r.statut === 'TERMINE').length * 50
    };
  }

  // ==================== GESTION DES SPÉCIALITÉS ====================

  loadSpecialites(): void {
    this.doctorService.getSpecialites().subscribe({
      next: (specialites) => {
        this.specialites = specialites;
        console.log('✅ Spécialités chargées:', this.specialites.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement spécialités:', error);
        this.showError('Erreur de chargement des spécialités');
        // Spécialités par défaut en cas d'erreur
        this.specialites = this.getSpecialitesParDefaut();
      }
    });
  }

  private getSpecialitesParDefaut(): Specialite[] {
    return [
      { id: 1, titre: 'Cardiologie', description: 'Spécialiste des maladies du cœur et des vaisseaux sanguins' },
      { id: 2, titre: 'Dermatologie', description: 'Spécialiste des maladies de la peau' },
      { id: 3, titre: 'Pédiatrie', description: 'Spécialiste des enfants et des adolescents' },
      { id: 4, titre: 'Gynécologie', description: 'Spécialiste de la santé féminine' },
      { id: 5, titre: 'Neurologie', description: 'Spécialiste des maladies du système nerveux' },
      { id: 6, titre: 'Ophtalmologie', description: 'Spécialiste des yeux et de la vision' },
      { id: 7, titre: 'Orthopédie', description: 'Spécialiste des problèmes musculo-squelettiques' },
      { id: 8, titre: 'Psychiatrie', description: 'Spécialiste des troubles mentaux' },
      { id: 9, titre: 'Radiologie', description: 'Spécialiste de l\'imagerie médicale' },
      { id: 10, titre: 'Chirurgie', description: 'Spécialiste des interventions chirurgicales' }
    ];
  }

  getDescriptionSpecialite(specialiteId: string): string {
    if (!specialiteId) return '';
    
    const specialite = this.specialites.find(s => s.id === +specialiteId);
    return specialite?.description || 'Description non disponible';
  }

  // ==================== GESTION DES ONGLETS ====================

  setActiveTab(tab: DashboardTabs): void {
  this.activeTab = tab;
  console.log('🔍 Onglet activé:', tab);
}

  // ==================== GESTION DES RENDEZ-VOUS ====================

  confirmerRendezVous(rendezVousId: number): void {
    console.log('✅ Confirmation du rendez-vous:', rendezVousId);
    this.doctorService.confirmerRendezVous(rendezVousId).subscribe({
      next: () => {
        this.loadDonnees();
        alert('Rendez-vous confirmé avec succès');
      },
      error: (error) => {
        console.error('❌ Erreur confirmation:', error);
        alert('Erreur lors de la confirmation: ' + error.message);
      }
    });
  }

  terminerRendezVous(rendezVousId: number): void {
    console.log('🏁 Finalisation du rendez-vous:', rendezVousId);
    this.doctorService.terminerRendezVous(rendezVousId).subscribe({
      next: () => {
        this.loadDonnees();
        alert('Rendez-vous marqué comme terminé');
      },
      error: (error) => {
        console.error('❌ Erreur finalisation:', error);
        alert('Erreur: ' + error.message);
      }
    });
  }

  annulerRendezVous(rendezVousId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      console.log('❌ Annulation du rendez-vous:', rendezVousId);
      this.doctorService.annulerRendezVous(rendezVousId).subscribe({
        next: () => {
          this.loadDonnees();
          alert('Rendez-vous annulé avec succès');
        },
        error: (error) => {
          console.error('❌ Erreur annulation:', error);
          alert('Erreur lors de l\'annulation: ' + error.message);
        }
      });
    }
  }

  ajouterNotes(rendezVousId: number, notes: string): void {
    if (notes.trim()) {
      console.log('📝 Ajout de notes au rendez-vous:', rendezVousId);
      this.doctorService.ajouterNotesRendezVous(rendezVousId, notes).subscribe({
        next: () => {
          this.loadDonnees();
          alert('Notes ajoutées avec succès');
        },
        error: (error) => {
          console.error('❌ Erreur ajout notes:', error);
          alert('Erreur lors de l\'ajout des notes: ' + error.message);
        }
      });
    }
  }

  ouvrirModalNotes(rdv: RendezVous): void {
    const notes = prompt('Ajouter des notes pour ce rendez-vous:', rdv.notes || '');
    if (notes !== null) {
      this.ajouterNotes(rdv.id, notes);
    }
  }

  // ==================== GESTION DES DISPONIBILITÉS ====================

  ouvrirModalDisponibilite(): void {
    const aujourdhui = new Date();
    const demain = new Date(aujourdhui);
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

    console.log('➕ Ajout disponibilité:', this.nouvelleDisponibilite);

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
          console.error('❌ Erreur ajout disponibilité:', error);
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
          console.error('❌ Erreur ajout indisponibilité:', error);
          alert('Erreur: ' + error.message);
        }
      });
    }
  }

  ouvrirModalGenererSemaine(): void {
    this.showModalGenererSemaine = true;
  }

  genererSemaineDisponibilites(): void {
    if (!this.docteurId) return;

    console.log('📅 Génération disponibilités semaine:', this.lundiProchain);
    
    this.doctorService.genererDisponibilitesSemaine(this.docteurId, this.lundiProchain.toISOString())
      .subscribe({
        next: () => {
          this.loadDonnees();
          this.fermerModalDisponibilite();
          alert('Disponibilités de la semaine générées avec succès');
        },
        error: (error) => {
          console.error('❌ Erreur génération semaine:', error);
          alert('Erreur: ' + error.message);
        }
      });
  }

  supprimerDisponibilite(disponibiliteId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      console.log('🗑️ Suppression disponibilité:', disponibiliteId);
      this.doctorService.supprimerDisponibilite(disponibiliteId).subscribe({
        next: () => {
          this.loadDonnees();
          alert('Disponibilité supprimée avec succès');
        },
        error: (error) => {
          console.error('❌ Erreur suppression:', error);
          alert('Erreur lors de la suppression: ' + error.message);
        }
      });
    }
  }

  // ==================== GESTION DU PROFIL ====================

  loadMonProfil(): void {
    if (!this.docteurId) return;

    console.log('👤 Chargement du profil...');
    
    this.doctorService.getMonProfil(this.docteurId).subscribe({
      next: (profil) => {
        this.monProfil = profil;
        this.initializeProfilForm(profil);
        console.log('✅ Profil chargé:', profil);
      },
      error: (error) => {
        console.error('❌ Erreur chargement profil:', error);
        this.showError('Erreur de chargement du profil');
      }
    });
  }

  private initializeProfilForm(profil: Docteur): void {
    this.profilForm = {
      nom: profil.nom || '',
      prenom: profil.prenom || '',
      telephone: profil.telephone || '',
      adresse: profil.adresse || '',
      specialite: profil.specialite?.id || '',
      numeroLicence: profil.numeroLicence || '',
      anneesExperience: profil.anneesExperience || 0,
      tarifConsultation: profil.tarifConsultation || 0,
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
      // Vérifier le type de fichier
      if (!file.type.match('image.*')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      this.photoFile = file;

      // Prévisualisation
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

    const specialiteId = +this.profilForm.specialite;

    const request: UpdateDocteurRequest = {
      nom: this.profilForm.nom,
      prenom: this.profilForm.prenom,
      telephone: this.profilForm.telephone,
      adresse: this.profilForm.adresse,
      specialiteId: specialiteId,
      numeroLicence: this.profilForm.numeroLicence,
      anneesExperience: this.profilForm.anneesExperience,
      tarifConsultation: this.profilForm.tarifConsultation,
      langue: this.profilForm.langue
    };

    console.log('✏️ Mise à jour profil:', request);

    // Mettre à jour les informations de base
    this.doctorService.updateMonProfil(this.docteurId, request).subscribe({
      next: (profil) => {
        this.monProfil = profil;
        
        // Mettre à jour la photo si une nouvelle a été sélectionnée
        if (this.photoFile) {
          this.mettreAJourPhoto();
        } else {
          this.fermerModalProfil();
          alert('Profil mis à jour avec succès');
          this.loadDonnees();
        }
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour profil:', error);
        alert('Erreur lors de la mise à jour du profil: ' + error.message);
      }
    });
  }

  private mettreAJourPhoto(): void {
    if (!this.docteurId || !this.photoFile) return;

    console.log('🖼️ Mise à jour photo...');
    
    this.doctorService.updatePhotoProfil(this.docteurId, this.photoFile).subscribe({
      next: (profil) => {
        this.monProfil = profil;
        this.fermerModalProfil();
        alert('Profil et photo mis à jour avec succès');
        this.loadDonnees();
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour photo:', error);
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

    if (!this.profilForm.specialite) {
      alert('Veuillez sélectionner une spécialité');
      return false;
    }

    if (this.profilForm.tarifConsultation <= 0) {
      alert('Le tarif de consultation doit être supérieur à 0');
      return false;
    }

    return true;
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'PLANIFIE': return 'badge-warning';
      case 'CONFIRME': return 'badge-success';
      case 'ANNULE': return 'badge-danger';
      case 'TERMINE': return 'badge-info';
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

  getDateCourte(dateHeure: string): string {
    return new Date(dateHeure).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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

  // ==================== GESTION DES PHOTOS ====================

  getPhotoUrl(photoPath: string): string {
    if (!photoPath) {
      return '';
    }
    
    // Nettoyer l'URL pour éviter les doubles slashes
    let cleanPath = photoPath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // environment.apiUrl se termine déjà par /, donc pas besoin de / supplémentaire
    return `${environment.apiUrl}${cleanPath}`;
  }

  getSafePhotoUrl(): string {
    if (!this.monProfil?.photo) {
      return '';
    }
    return this.getPhotoUrl(this.monProfil.photo);
  }

  onPhotoError(event: any): void {
    console.error('❌ Erreur de chargement de la photo');
    console.error('URL tentée:', event.target.src);
    
    // Masquer l'image et montrer le placeholder
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

  // ==================== MÉTHODES POUR LES HEURES ET DATES ====================

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

  // ==================== MÉTHODES DE NAVIGATION ====================
  
  deconnexion(): void {
    this.showProfileMenu = false;
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}