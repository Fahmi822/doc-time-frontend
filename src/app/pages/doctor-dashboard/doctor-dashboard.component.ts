import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DoctorService, RendezVous, Disponibilite, Patient } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  rendezVous: RendezVous[] = [];
  rendezVousAujourdhui: RendezVous[] = [];
  disponibilites: Disponibilite[] = [];
  activeTab: string = 'aujourdhui';
  isLoading: boolean = false;
  docteurId: number | null = null;
  
  // Statistiques
  statistiques: any = {
    totalRendezVous: 0,
    rendezVousConfirmes: 0,
    nouveauxPatients: 0,
    revenuMensuel: 0
  };

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.docteurId = this.authService.getUserId();
    
    if (!this.docteurId) {
      alert('Erreur: Docteur non connecté');
      this.router.navigate(['/login']);
      return;
    }

    this.loadDonnees();
  }

  loadDonnees(): void {
    if (!this.docteurId) return;

    this.isLoading = true;

    // Charger les rendez-vous d'aujourd'hui
    this.doctorService.getRendezVousAujourdhui(this.docteurId).subscribe({
      next: (data) => {
        this.rendezVousAujourdhui = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement rendez-vous:', error);
        this.isLoading = false;
      }
    });

    // Charger tous les rendez-vous
    this.doctorService.getMesRendezVous(this.docteurId).subscribe({
      next: (data) => {
        this.rendezVous = data;
      },
      error: (error) => {
        console.error('Erreur chargement rendez-vous:', error);
      }
    });

    // Charger les disponibilités
    this.doctorService.getMesDisponibilites(this.docteurId).subscribe({
      next: (data) => {
        this.disponibilites = data;
      },
      error: (error) => {
        console.error('Erreur chargement disponibilités:', error);
      }
    });

    // Charger les statistiques
    this.doctorService.getStatistiquesDocteur(this.docteurId).subscribe({
      next: (data) => {
        this.statistiques = data;
      },
      error: (error) => {
        console.error('Erreur chargement statistiques:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  confirmerRendezVous(rendezVousId: number): void {
    this.doctorService.updateStatutRendezVous(rendezVousId, 'CONFIRME').subscribe({
      next: () => {
        this.loadDonnees();
        alert('Rendez-vous confirmé avec succès');
      },
      error: (error) => {
        alert('Erreur lors de la confirmation: ' + error.error);
      }
    });
  }

  terminerRendezVous(rendezVousId: number): void {
    this.doctorService.updateStatutRendezVous(rendezVousId, 'TERMINE').subscribe({
      next: () => {
        this.loadDonnees();
        alert('Rendez-vous marqué comme terminé');
      },
      error: (error) => {
        alert('Erreur: ' + error.error);
      }
    });
  }

  annulerRendezVous(rendezVousId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      this.doctorService.updateStatutRendezVous(rendezVousId, 'ANNULE').subscribe({
        next: () => {
          this.loadDonnees();
          alert('Rendez-vous annulé avec succès');
        },
        error: (error) => {
          alert('Erreur lors de l\'annulation: ' + error.error);
        }
      });
    }
  }

  ajouterNotes(rendezVousId: number, notes: string): void {
    if (notes.trim()) {
      this.doctorService.ajouterNotesRendezVous(rendezVousId, notes).subscribe({
        next: () => {
          this.loadDonnees();
          alert('Notes ajoutées avec succès');
        },
        error: (error) => {
          alert('Erreur lors de l\'ajout des notes: ' + error.error);
        }
      });
    }
  }

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

  estRendezVousPasse(dateHeure: string): boolean {
    return new Date(dateHeure) < new Date();
  }
  // Méthodes utilitaires
calculerAge(dateNaissance: string): number {
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

// Méthodes pour les modales (à implémenter)
ouvrirModalNotes(rdv: RendezVous): void {
  const notes = prompt('Ajouter des notes pour ce rendez-vous:', rdv.notes || '');
  if (notes !== null) {
    this.ajouterNotes(rdv.id, notes);
  }
}

ouvrirModalDisponibilite(): void {
  alert('Fonctionnalité à implémenter: Ajouter une disponibilité');
  // Implémentez une modal pour ajouter des disponibilités
}

supprimerDisponibilite(disponibiliteId: number): void {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
    this.doctorService.supprimerDisponibilite(disponibiliteId).subscribe({
      next: () => {
        this.loadDonnees();
        alert('Disponibilité supprimée avec succès');
      },
      error: (error) => {
        alert('Erreur lors de la suppression: ' + error.error);
      }
    });
  }
}
}