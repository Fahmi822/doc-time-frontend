import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateNaissance: string;
  groupeSanguin: string;
  antecedentsMedicaux: string;
  photo?: string;
  actif: boolean;
  dateCreation: string;
  dateModification: string;
}

export interface RendezVous {
  id: number;
  dateHeure: string;
  statut: 'PLANIFIE' | 'CONFIRME' | 'ANNULE' | 'TERMINE' | 'ABSENT';
  motif: string;
  notes?: string;
  dateCreation: string;
  dateModification: string;
  patient: Patient;
  docteur: Docteur;
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

export interface Specialite {
  id: number;
  titre: string;
  description: string;
}

export interface CreateRendezVousRequest {
  dateHeure: string;
  motif: string;
  patientId: number;
  docteurId: number;
}

export interface UpdatePatientRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
}

export interface DashboardData {
  prochainsRendezVous: RendezVous[];
  rendezVousRecents: RendezVous[];
  statistiques: {
    totalRendezVous: number;
    rendezVousConfirmes: number;
    rendezVousAnnules: number;
    prochainRendezVous?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
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
    console.error('Erreur API Patient:', error);
    
    if (error.status === 0) {
      return throwError(() => new Error('Impossible de se connecter au serveur.'));
    } else if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('Session expirée'));
    } else if (error.status === 403) {
      return throwError(() => new Error('Accès refusé'));
    }
    
    const errorMessage = error.error?.message || error.error || error.message || 'Erreur serveur';
    return throwError(() => new Error(errorMessage));
  }

  // ==================== DASHBOARD ====================
  getDashboardData(patientId: number): Observable<DashboardData> {
    const url = `${this.apiUrl}/patients/${patientId}/dashboard`;
    return this.http.get<DashboardData>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getPatientStats(patientId: number): Observable<any> {
    const url = `${this.apiUrl}/patients/${patientId}/stats`;
    return this.http.get<any>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== PROFIL PATIENT ====================
  getMonProfil(patientId: number): Observable<Patient> {
    const url = `${this.apiUrl}/patients/${patientId}/profil`;
    return this.http.get<Patient>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updateMonProfil(patientId: number, request: UpdatePatientRequest): Observable<Patient> {
    const url = `${this.apiUrl}/patients/${patientId}/profil`;
    return this.http.put<Patient>(url, request, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updatePhotoProfil(patientId: number, photo: File): Observable<Patient> {
    const url = `${this.apiUrl}/patients/${patientId}/photo`;
    
    const formData = new FormData();
    formData.append('photo', photo);
    
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.put<Patient>(url, formData, { headers })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== RENDEZ-VOUS ====================
  getMesRendezVous(patientId: number): Observable<RendezVous[]> {
    const url = `${this.apiUrl}/patients/${patientId}/rendezvous`;
    return this.http.get<RendezVous[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getProchainsRendezVous(patientId: number): Observable<RendezVous[]> {
    const url = `${this.apiUrl}/patients/${patientId}/rendezvous/prochains`;
    return this.http.get<RendezVous[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getRendezVousPasses(patientId: number): Observable<RendezVous[]> {
    const url = `${this.apiUrl}/patients/${patientId}/rendezvous/passes`;
    return this.http.get<RendezVous[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  prendreRendezVous(request: CreateRendezVousRequest): Observable<RendezVous> {
    const url = `${this.apiUrl}/rendezvous`;
    return this.http.post<RendezVous>(url, request, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError((error) => {
        if (error.error?.creneauxDisponibles) {
          return throwError(() => ({
            type: 'DOCTEUR_NON_DISPONIBLE',
            message: error.error.message,
            creneauxDisponibles: error.error.creneauxDisponibles
          }));
        }
        return this.handleError(error);
      })
    );
  }

  annulerRendezVous(rendezVousId: number, patientId: number): Observable<RendezVous> {
    const url = `${this.apiUrl}/rendezvous/${rendezVousId}/annuler?patientId=${patientId}`;
    return this.http.put<RendezVous>(url, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  confirmerRendezVous(rendezVousId: number, patientId: number): Observable<RendezVous> {
    const url = `${this.apiUrl}/rendezvous/${rendezVousId}/confirmer?patientId=${patientId}`;
    return this.http.put<RendezVous>(url, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== DOCTEURS ====================
  getAllDocteurs(): Observable<Docteur[]> {
    const url = `${this.apiUrl}/docteurs`;
    return this.http.get<Docteur[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getDocteursBySpecialite(specialiteId: number): Observable<Docteur[]> {
    const url = `${this.apiUrl}/docteurs/specialite/${specialiteId}`;
    return this.http.get<Docteur[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getDocteurById(docteurId: number): Observable<Docteur> {
    const url = `${this.apiUrl}/docteurs/${docteurId}`;
    return this.http.get<Docteur>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  searchDocteurs(query: string): Observable<Docteur[]> {
    const url = `${this.apiUrl}/docteurs/search?q=${encodeURIComponent(query)}`;
    return this.http.get<Docteur[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== DISPONIBILITÉS ====================
  verifierDisponibilite(docteurId: number, dateHeure: string): Observable<boolean> {
    const url = `${this.apiUrl}/disponibilites/docteur/${docteurId}/disponible?dateHeure=${encodeURIComponent(dateHeure)}`;
    return this.http.get<boolean>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getCreneauxDisponibles(docteurId: number, dateDebut: string, dateFin: string): Observable<string[]> {
    const url = `${this.apiUrl}/disponibilites/docteur/${docteurId}/creneaux?dateDebut=${encodeURIComponent(dateDebut)}&dateFin=${encodeURIComponent(dateFin)}`;
    return this.http.get<string[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== SPÉCIALITÉS ====================
  getSpecialites(): Observable<Specialite[]> {
    const url = `${this.apiUrl}/specialites`;
    return this.http.get<Specialite[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }
}