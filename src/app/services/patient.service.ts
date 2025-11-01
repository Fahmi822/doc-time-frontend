import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface RendezVous {
  id: number;
  dateHeure: string;
  statut: string;
  motif: string;
  notes?: string;
  dateCreation: string;
  dateModification: string;
  patient: any;
  docteur: any;
}

export interface Docteur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  specialite: any;
  anneesExperience: number;
  tarifConsultation: number;
  noteMoyenne: number;
  nombreAvis: number;
  langue: string;
  photo?: string;
}

export interface CreateRendezVousRequest {
  dateHeure: string;
  motif: string;
  patientId: number;
  docteurId: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Rendez-vous
  getMesRendezVous(patientId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.apiUrl}/rendezvous/patient/${patientId}`);
  }

  prendreRendezVous(request: CreateRendezVousRequest): Observable<RendezVous> {
    return this.http.post<RendezVous>(`${this.apiUrl}/rendezvous`, request);
  }

  annulerRendezVous(rendezVousId: number, patientId: number): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.apiUrl}/rendezvous/${rendezVousId}/annuler?patientId=${patientId}`, {});
  }

  confirmerRendezVous(rendezVousId: number, patientId: number): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.apiUrl}/rendezvous/${rendezVousId}/confirmer?patientId=${patientId}`, {});
  }

  // Docteurs
  getAllDocteurs(): Observable<Docteur[]> {
    return this.http.get<Docteur[]>(`${this.apiUrl}/docteurs`);
  }

  getDocteursBySpecialite(specialiteId: number): Observable<Docteur[]> {
    return this.http.get<Docteur[]>(`${this.apiUrl}/docteurs/specialite/${specialiteId}`);
  }

  getDocteurById(docteurId: number): Observable<Docteur> {
    return this.http.get<Docteur>(`${this.apiUrl}/docteurs/${docteurId}`);
  }

  searchDocteurs(query: string): Observable<Docteur[]> {
    return this.http.get<Docteur[]>(`${this.apiUrl}/docteurs/search?q=${encodeURIComponent(query)}`);
  }
}