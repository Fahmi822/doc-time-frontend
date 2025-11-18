import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, Utilisateur, StatistiquesGlobales, RendezVousAdmin } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  statistiques: StatistiquesGlobales = {
    totalUtilisateurs: 0,
    totalPatients: 0,
    totalDocteurs: 0,
    totalRendezVous: 0,
    rendezVousAujourdhui: 0,
    revenuMensuel: 0,
    tauxOccupation: 0
  };

  utilisateurs: Utilisateur[] = [];
  rendezVousRecents: RendezVousAdmin[] = [];
  activeTab: string = 'tableau-de-bord';
  isLoading: boolean = false;
  adminId: number | null = null;

  // Filtres
  filtreRole: string = 'TOUS';
  filtreStatut: string = 'TOUS';
  rechercheUtilisateur: string = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminId = this.authService.getUserId();
    
    if (!this.adminId) {
      alert('Erreur: Admin non connecté');
      this.router.navigate(['/login']);
      return;
    }

    this.loadDonnees();
  }

  loadDonnees(): void {
    this.isLoading = true;

    // Charger les statistiques
    this.adminService.getStatistiquesGlobales().subscribe({
      next: (data) => {
        this.statistiques = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement statistiques:', error);
        this.isLoading = false;
      }
    });

    // Charger les utilisateurs
    this.loadUtilisateurs();

    // Charger les rendez-vous récents
    this.adminService.getRendezVousRecent().subscribe({
      next: (data) => {
        this.rendezVousRecents = data;
      },
      error: (error) => {
        console.error('Erreur chargement rendez-vous:', error);
      }
    });
  }

  loadUtilisateurs(): void {
    if (this.filtreRole === 'TOUS') {
      this.adminService.getAllUtilisateurs().subscribe({
        next: (data) => {
          this.utilisateurs = data;
        },
        error: (error) => {
          console.error('Erreur chargement utilisateurs:', error);
        }
      });
    } else {
      this.adminService.getUtilisateursByRole(this.filtreRole).subscribe({
        next: (data) => {
          this.utilisateurs = data;
        },
        error: (error) => {
          console.error('Erreur chargement utilisateurs:', error);
        }
      });
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'utilisateurs') {
      this.loadUtilisateurs();
    }
  }

  // Filtres
  onFiltreRoleChange(role: string): void {
    this.filtreRole = role;
    this.loadUtilisateurs();
  }

  onRechercheChange(): void {
    // Le filtrage se fait côté template avec getUtilisateursFiltres()
  }

  // Actions sur les utilisateurs
  toggleActifUtilisateur(utilisateur: Utilisateur): void {
    const action = utilisateur.actif ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} ${utilisateur.prenom} ${utilisateur.nom} ?`)) {
      this.adminService.toggleUtilisateurActif(utilisateur.id).subscribe({
        next: (updatedUser) => {
          // Mettre à jour l'utilisateur dans la liste
          const index = this.utilisateurs.findIndex(u => u.id === utilisateur.id);
          if (index !== -1) {
            this.utilisateurs[index] = updatedUser;
          }
          alert(`Utilisateur ${action} avec succès`);
        },
        error: (error) => {
          alert('Erreur: ' + error.message);
        }
      });
    }
  }

  supprimerUtilisateur(utilisateur: Utilisateur): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${utilisateur.prenom} ${utilisateur.nom} ?`)) {
      this.adminService.deleteUtilisateur(utilisateur.id).subscribe({
        next: () => {
          this.utilisateurs = this.utilisateurs.filter(u => u.id !== utilisateur.id);
          alert('Utilisateur supprimé avec succès');
        },
        error: (error) => {
          alert('Erreur: ' + error.message);
        }
      });
    }
  }

  // Méthodes utilitaires
  getUtilisateursFiltres(): Utilisateur[] {
    return this.utilisateurs.filter(utilisateur => {
      const correspondRecherche = this.rechercheUtilisateur === '' || 
        utilisateur.nom.toLowerCase().includes(this.rechercheUtilisateur.toLowerCase()) ||
        utilisateur.prenom.toLowerCase().includes(this.rechercheUtilisateur.toLowerCase()) ||
        utilisateur.email.toLowerCase().includes(this.rechercheUtilisateur.toLowerCase());

      const correspondStatut = this.filtreStatut === 'TOUS' || 
        (this.filtreStatut === 'ACTIF' && utilisateur.actif) ||
        (this.filtreStatut === 'INACTIF' && !utilisateur.actif);

      return correspondRecherche && correspondStatut;
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'badge-danger';
      case 'DOCTEUR': return 'badge-warning';
      case 'PATIENT': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getStatutBadgeClass(actif: boolean): string {
    return actif ? 'badge-success' : 'badge-danger';
  }

  getRendezVousStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'PLANIFIE': return 'badge-warning';
      case 'CONFIRME': return 'badge-success';
      case 'ANNULE': return 'badge-danger';
      case 'TERMINE': return 'badge-info';
      case 'ABSENT': return 'badge-dark';
      default: return 'badge-secondary';
    }
  }

  getDateFormatee(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getHeureFormatee(date: string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Navigation
  ouvrirGestionUtilisateurs(): void {
    this.setActiveTab('utilisateurs');
  }

  ouvrirGestionRendezVous(): void {
    this.setActiveTab('rendezvous');
  }

  ouvrirRapports(): void {
    this.setActiveTab('rapports');
  }

  // Méthodes pour les modales
  ouvrirModalCreationUtilisateur(): void {
    alert('Fonctionnalité à implémenter: Créer un utilisateur');
  }

  ouvrirModalEditionUtilisateur(utilisateur: Utilisateur): void {
    alert(`Fonctionnalité à implémenter: Éditer ${utilisateur.prenom} ${utilisateur.nom}`);
  }
}