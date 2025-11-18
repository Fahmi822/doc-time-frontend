import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export interface RendezVous {
  id: number;
  dateHeure: string;
  statut: 'PLANIFIE' | 'CONFIRME' | 'ANNULE' | 'TERMINE' | 'ABSENT';
  motif: string;
  notes?: string;
  dateCreation: string;
  dateModification: string;
  patient: Patient;
  docteur: any;
}

export interface Specialite {
  id: number;
  titre: string;
  description: string;
}

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
  photo?: string;
  actif: boolean;
}

export interface Disponibilite {
  id: number;
  dateHeureDebut: string;
  dateHeureFin: string;
  disponible: boolean;
  motifIndisponibilite?: string;
  docteur: any;
  dateCreation: string;
}

export interface UpdateDocteurRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  specialiteId?: number;
  numeroLicence?: string;
  anneesExperience?: number;
  tarifConsultation?: number;
  langue?: string;
}

export interface CreateDisponibiliteRequest {
  dateHeureDebut: string;
  dateHeureFin: string;
  docteurId: number;
}

export interface DisponibiliteRequest {
  dateHeureDebut: string;
  dateHeureFin: string;
  docteurId: number;
  motifIndisponibilite?: string;
}

export interface StatistiquesDocteur {
  totalRendezVous: number;
  rendezVousConfirmes: number;
  nouveauxPatients: number;
  revenuMensuel: number;
  tauxOccupation: number;
  noteMoyenne: number;
}

export interface Docteur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  specialite: Specialite;
  numeroLicence?: string;
  anneesExperience?: number;
  tarifConsultation?: number;
  langue?: string;
  photo?: string;
  noteMoyenne?: number;
  nombreAvis?: number;
  telephone?: string;
  adresse?: string;
  actif: boolean;
  dateCreation: string;
  dateModification: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token && this.authService.isLoggedIn()) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Erreur API Doctor:', error);
    
    if (error.status === 0) {
      return throwError(() => new Error('Impossible de se connecter au serveur.'));
    } else if (error.status === 401 || error.status === 403) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('Session expirée'));
    }
    
    const errorMessage = error.error?.message || error.error || error.message || 'Erreur serveur';
    return throwError(() => new Error(errorMessage));
  }

  // ==================== RENDEZ-VOUS ====================
  getMesRendezVous(docteurId: number): Observable<RendezVous[]> {
    const url = `${this.apiUrl}/rendezvous/docteur/${docteurId}`;
    return this.http.get<RendezVous[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getRendezVousParDate(docteurId: number, date: string): Observable<RendezVous[]> {
    const url = `${this.apiUrl}/rendezvous/docteur/${docteurId}/date/${date}`;
    return this.http.get<RendezVous[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getRendezVousParStatut(docteurId: number, statut: string): Observable<RendezVous[]> {
    const url = `${this.apiUrl}/rendezvous/docteur/${docteurId}/statut/${statut}`;
    return this.http.get<RendezVous[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  terminerRendezVous(rendezVousId: number): Observable<RendezVous> {
    const url = `${this.apiUrl}/rendezvous/${rendezVousId}/terminer`;
    return this.http.put<RendezVous>(url, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== DISPONIBILITÉS ====================
  getMesDisponibilites(docteurId: number): Observable<Disponibilite[]> {
    const url = `${this.apiUrl}/disponibilites/docteur/${docteurId}`;
    return this.http.get<Disponibilite[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  ajouterDisponibilite(request: CreateDisponibiliteRequest): Observable<Disponibilite> {
    const url = `${this.apiUrl}/disponibilites`;
    return this.http.post<Disponibilite>(url, request, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  ajouterIndisponibilite(request: DisponibiliteRequest): Observable<Disponibilite> {
    const url = `${this.apiUrl}/disponibilites/indisponible`;
    return this.http.post<Disponibilite>(url, request, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  supprimerDisponibilite(disponibiliteId: number): Observable<void> {
    const url = `${this.apiUrl}/disponibilites/${disponibiliteId}`;
    return this.http.delete<void>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== PROFIL DOCTEUR ====================
  getMonProfil(docteurId: number): Observable<Docteur> {
    const url = `${this.apiUrl}/docteurs/${docteurId}`;
    return this.http.get<Docteur>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updateMonProfil(docteurId: number, profil: UpdateDocteurRequest): Observable<Docteur> {
    const url = `${this.apiUrl}/docteurs/${docteurId}`;
    return this.http.put<Docteur>(url, profil, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updatePhotoProfil(docteurId: number, photo: File): Observable<Docteur> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/photo`;
    
    const formData = new FormData();
    formData.append('photo', photo);
    
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.put<Docteur>(url, formData, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getSpecialites(): Observable<Specialite[]> {
  const url = `${this.apiUrl}/specialites`;
  
  // Pour les spécialités, on n'envoie PAS le token car c'est nécessaire pour l'inscription
  // avant que l'utilisateur soit connecté
  let headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return this.http.get<Specialite[]>(url, { 
    headers: headers
  }).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Erreur chargement spécialités:', error);
      
      if (error.status === 0) {
        return throwError(() => new Error('Impossible de se connecter au serveur.'));
      }
      
      const errorMessage = error.error?.message || error.error || error.message || 'Erreur serveur';
      return throwError(() => new Error(errorMessage));
    })
  );
}

  // ==================== STATISTIQUES ====================
  getStatistiquesDocteur(docteurId: number): Observable<StatistiquesDocteur> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/statistiques`;
    return this.http.get<StatistiquesDocteur>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== PATIENTS ====================
  getMesPatients(docteurId: number): Observable<Patient[]> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/patients`;
    return this.http.get<Patient[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getNouveauxPatients(docteurId: number): Observable<Patient[]> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/patients/nouveaux`;
    return this.http.get<Patient[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getPatientDetails(docteurId: number, patientId: number): Observable<Patient> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/patients/${patientId}`;
    return this.http.get<Patient>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getHistoriquePatient(docteurId: number, patientId: number): Observable<RendezVous[]> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/patients/${patientId}/historique`;
    return this.http.get<RendezVous[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== AGENDA ====================
  getAgenda(docteurId: number, dateDebut: string, dateFin: string): Observable<any> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/agenda?dateDebut=${dateDebut}&dateFin=${dateFin}`;
    return this.http.get<any>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== UTILITAIRES ====================
  rechercherPatients(docteurId: number, query: string): Observable<Patient[]> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/patients/recherche?q=${encodeURIComponent(query)}`;
    return this.http.get<Patient[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  verifierConflitRendezVous(docteurId: number, dateHeure: string, duree: number = 30): Observable<boolean> {
    const url = `${this.apiUrl}/docteurs/${docteurId}/verifier-conflit?dateHeure=${dateHeure}&duree=${duree}`;
    return this.http.get<boolean>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }
}