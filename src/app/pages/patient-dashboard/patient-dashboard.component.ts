import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PatientService, RendezVous, Docteur } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  rendezVous: RendezVous[] = [];
  docteurs: Docteur[] = [];
  activeTab: string = 'rendez-vous';
  isLoading: boolean = false;
  patientId: number | null = null;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.patientId = this.getPatientId();
    
    if (this.patientId) {
      this.loadMesRendezVous();
      this.loadDocteurs();
    } else {
      console.error('ID patient non trouvé');
      this.router.navigate(['/login']);
    }
  }

  loadMesRendezVous(): void {
    if (!this.patientId) return;
    
    this.isLoading = true;
    
    this.patientService.getMesRendezVous(this.patientId).subscribe({
      next: (data) => {
        this.rendezVous = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement rendez-vous:', error);
        this.isLoading = false;
      }
    });
  }

  loadDocteurs(): void {
    this.patientService.getAllDocteurs().subscribe({
      next: (data) => {
        this.docteurs = data;
      },
      error: (error) => {
        console.error('Erreur chargement docteurs:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  prendreRendezVous(): void {
    this.router.navigate(['/patient/nouveau-rendezvous']);
  }

  prendreRendezVousAvecDocteur(docteurId: number): void {
    this.router.navigate(['/patient/nouveau-rendezvous'], {
      queryParams: { docteurId: docteurId }
    });
  }

  annulerRendezVous(rendezVousId: number): void {
    if (!this.patientId) return;
    
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      this.patientService.annulerRendezVous(rendezVousId, this.patientId).subscribe({
        next: () => {
          this.loadMesRendezVous();
          alert('Rendez-vous annulé avec succès');
        },
        error: (error) => {
          alert('Erreur lors de l\'annulation: ' + error.error);
        }
      });
    }
  }

  confirmerRendezVous(rendezVousId: number): void {
    if (!this.patientId) return;
    
    this.patientService.confirmerRendezVous(rendezVousId, this.patientId).subscribe({
      next: () => {
        this.loadMesRendezVous();
        alert('Rendez-vous confirmé avec succès');
      },
      error: (error) => {
        alert('Erreur lors de la confirmation: ' + error.error);
      }
    });
  }

  private getPatientId(): number | null {
    return this.authService.getUserId();
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
}