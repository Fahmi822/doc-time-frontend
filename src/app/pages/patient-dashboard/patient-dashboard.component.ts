import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService, RendezVous, Docteur, Patient, DashboardData, UpdatePatientRequest } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';

enum PatientTabs {
  TABLEAU_BORD = 'tableau_bord',
  RENDEZ_VOUS = 'rendez_vous',
  DOCTEURS = 'docteurs',
  PROFIL = 'profil'
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  PatientTabs = PatientTabs;
  activeTab: PatientTabs = PatientTabs.TABLEAU_BORD;
  
  dashboardData: DashboardData = {
    prochainsRendezVous: [],
    rendezVousRecents: [],
    statistiques: {
      totalRendezVous: 0,
      rendezVousConfirmes: 0,
      rendezVousAnnules: 0,
      prochainRendezVous: undefined
    }
  };
  
  rendezVous: RendezVous[] = [];
  docteurs: Docteur[] = [];
  monProfil: Patient | null = null;
  
  showProfileMenu = false;
  showModalProfil = false;
  isLoading = false;
  hasConnectionError = false;
  errorMessage = '';
  
  profilForm: UpdatePatientRequest = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    dateNaissance: '',
    groupeSanguin: '',
    antecedentsMedicaux: ''
  };
  
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;

  private patientId: number | null = null;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.patientId = this.authService.getUserId();
    
    if (!this.patientId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    this.hasConnectionError = false;

    try {
      await Promise.all([
        this.loadDashboardData(),
        this.loadMonProfil(),
        this.loadDocteurs()
      ]);
    } catch (error) {
      this.hasConnectionError = true;
      this.errorMessage = 'Erreur de chargement des données';
      console.error('Erreur chargement initial:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadDashboardData(): Promise<void> {
    if (!this.patientId) return;

    try {
      const data = await this.patientService.getDashboardData(this.patientId).toPromise();
      if (data) {
        this.dashboardData = data;
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      await this.loadRendezVousBasique();
    }
  }

  async loadRendezVousBasique(): Promise<void> {
    if (!this.patientId) return;

    try {
      const rendezVousData = await this.patientService.getMesRendezVous(this.patientId).toPromise();
      this.rendezVous = rendezVousData || [];
      
      // Calculer les statistiques basiques
      const maintenant = new Date();
      this.dashboardData.statistiques = {
        totalRendezVous: this.rendezVous.length,
        rendezVousConfirmes: this.rendezVous.filter(r => r.statut === 'CONFIRME').length,
        rendezVousAnnules: this.rendezVous.filter(r => r.statut === 'ANNULE').length,
        prochainRendezVous: this.rendezVous
          .filter(r => new Date(r.dateHeure) > maintenant && r.statut !== 'ANNULE')
          .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())[0]?.dateHeure
      };

      // Prochains rendez-vous (dans les 7 prochains jours)
      const dans7Jours = new Date(maintenant);
      dans7Jours.setDate(dans7Jours.getDate() + 7);
      
      this.dashboardData.prochainsRendezVous = this.rendezVous
        .filter(r => {
          const dateRdv = new Date(r.dateHeure);
          return dateRdv > maintenant && dateRdv <= dans7Jours && r.statut !== 'ANNULE';
        })
        .slice(0, 5);

      // Rendez-vous récents (7 derniers jours)
      const ilYA7Jours = new Date(maintenant);
      ilYA7Jours.setDate(ilYA7Jours.getDate() - 7);
      
      this.dashboardData.rendezVousRecents = this.rendezVous
        .filter(r => {
          const dateRdv = new Date(r.dateHeure);
          return dateRdv >= ilYA7Jours && dateRdv <= maintenant;
        })
        .slice(0, 5);

    } catch (error) {
      console.error('Erreur chargement rendez-vous basique:', error);
    }
  }

  async loadMonProfil(): Promise<void> {
    if (!this.patientId) return;

    try {
      const profil = await this.patientService.getMonProfil(this.patientId).toPromise();
      this.monProfil = profil || null;
      
      if (this.monProfil) {
        this.profilForm = {
          nom: this.monProfil.nom || '',
          prenom: this.monProfil.prenom || '',
          telephone: this.monProfil.telephone || '',
          adresse: this.monProfil.adresse || '',
          dateNaissance: this.monProfil.dateNaissance || '',
          groupeSanguin: this.monProfil.groupeSanguin || '',
          antecedentsMedicaux: this.monProfil.antecedentsMedicaux || ''
        };
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  }

  async loadDocteurs(): Promise<void> {
    try {
      const docteursData = await this.patientService.getAllDocteurs().toPromise();
      this.docteurs = docteursData || [];
    } catch (error) {
      console.error('Erreur chargement docteurs:', error);
    }
  }

  async loadRendezVous(): Promise<void> {
    if (!this.patientId) return;

    try {
      const rendezVousData = await this.patientService.getMesRendezVous(this.patientId).toPromise();
      this.rendezVous = rendezVousData || [];
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    }
  }

  setActiveTab(tab: PatientTabs): void {
    this.activeTab = tab;
    
    if (tab === PatientTabs.RENDEZ_VOUS) {
      this.loadRendezVous();
    }
  }

  prendreRendezVous(): void {
    this.router.navigate(['/patient/nouveau-rendezvous']);
  }

  prendreRendezVousAvecDocteur(docteurId: number): void {
  this.router.navigate(['/patient/nouveau-rendezvous'], { 
    queryParams: { docteur: docteurId }  // Changé de 'docteurId' à 'docteur'
  });
}

  async confirmerRendezVous(rendezVousId: number): Promise<void> {
    if (!this.patientId) return;

    if (!confirm('Confirmer ce rendez-vous ?')) return;

    try {
      await this.patientService.confirmerRendezVous(rendezVousId, this.patientId).toPromise();
      await this.loadDashboardData();
      alert('Rendez-vous confirmé avec succès !');
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Impossible de confirmer le rendez-vous'));
    }
  }

  async annulerRendezVous(rendezVousId: number): Promise<void> {
    if (!this.patientId) return;

    if (!confirm('Annuler ce rendez-vous ? Cette action est irréversible.')) return;

    try {
      await this.patientService.annulerRendezVous(rendezVousId, this.patientId).toPromise();
      await this.loadDashboardData();
      alert('Rendez-vous annulé avec succès !');
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Impossible d\'annuler le rendez-vous'));
    }
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

  ouvrirModalProfil(): void {
    this.showModalProfil = true;
    this.showProfileMenu = false;
  }

  fermerModalProfil(): void {
    this.showModalProfil = false;
    this.photoPreview = null;
    this.selectedPhoto = null;
    
    if (this.monProfil) {
      this.profilForm = {
        nom: this.monProfil.nom || '',
        prenom: this.monProfil.prenom || '',
        telephone: this.monProfil.telephone || '',
        adresse: this.monProfil.adresse || '',
        dateNaissance: this.monProfil.dateNaissance || '',
        groupeSanguin: this.monProfil.groupeSanguin || '',
        antecedentsMedicaux: this.monProfil.antecedentsMedicaux || ''
      };
    }
  }

  async mettreAJourProfil(): Promise<void> {
    if (!this.patientId) return;

    this.isLoading = true;

    try {
      // Mettre à jour les informations de base
      const updatedProfil = await this.patientService.updateMonProfil(this.patientId, this.profilForm).toPromise();
      if (updatedProfil) {
        this.monProfil = updatedProfil;
      }

      // Mettre à jour la photo si une nouvelle a été sélectionnée
      if (this.selectedPhoto) {
        const profilWithPhoto = await this.patientService.updatePhotoProfil(this.patientId, this.selectedPhoto).toPromise();
        if (profilWithPhoto) {
          this.monProfil = profilWithPhoto;
        }
      }

      alert('Profil mis à jour avec succès !');
      this.fermerModalProfil();
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Impossible de mettre à jour le profil'));
    } finally {
      this.isLoading = false;
    }
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    this.selectedPhoto = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.photoPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  supprimerPhoto(): void {
    this.photoPreview = null;
    this.selectedPhoto = null;
  }

 getSafePhotoUrl(): string {
  if (!this.monProfil?.photo) {
    return '/assets/default-avatar.png';
  }
  return this.getPhotoUrl(this.monProfil.photo);
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

  onPhotoError(event: any): void {
    console.error('Erreur de chargement de la photo:', event);
    event.target.src = 'assets/default-avatar.png';
  }

  getInitials(): string {
    if (!this.monProfil) return '??';
    return (this.monProfil.prenom?.charAt(0) || '') + (this.monProfil.nom?.charAt(0) || '');
  }

  getDateFormatee(dateString: string): string {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  }

  getDateCourte(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  getHeureFromDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  estRendezVousPasse(dateString: string): boolean {
    if (!dateString) return false;
    try {
      const dateRdv = new Date(dateString);
      return dateRdv < new Date();
    } catch {
      return false;
    }
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut?.toUpperCase()) {
      case 'PLANIFIE': return 'badge-warning';
      case 'CONFIRME': return 'badge-success';
      case 'ANNULE': return 'badge-danger';
      case 'TERMINE': return 'badge-info';
      case 'ABSENT': return 'badge-dark';
      default: return 'badge-secondary';
    }
  }

  calculerAge(dateNaissance: string): number {
    if (!dateNaissance) return 0;
    try {
      const today = new Date();
      const birthDate = new Date(dateNaissance);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return 0;
    }
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  onSearchDocteurs(event: any): void {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
      this.loadDocteurs();
      return;
    }

    this.docteurs = this.docteurs.filter(docteur =>
      docteur.nom.toLowerCase().includes(searchTerm) ||
      docteur.prenom.toLowerCase().includes(searchTerm) ||
      docteur.specialite?.titre?.toLowerCase().includes(searchTerm)
    );
  }

  deconnexion(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  retryLoad(): void {
    this.loadInitialData();
  }

  loadDonnees(): void {
    this.loadInitialData();
  }
}