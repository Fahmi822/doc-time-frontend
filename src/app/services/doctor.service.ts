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
  patient: Patient;
  docteur: any;
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
}

export interface Disponibilite {
  id: number;
  dateHeureDebut: string;
  dateHeureFin: string;
  disponible: boolean;
}

export interface CreateDisponibiliteRequest {
  dateHeureDebut: string;
  dateHeureFin: string;
  docteurId: number;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Rendez-vous
  getMesRendezVous(docteurId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.apiUrl}/rendezvous/docteur/${docteurId}`);
  }

  getRendezVousAujourdhui(docteurId: number): Observable<RendezVous[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<RendezVous[]>(`${this.apiUrl}/rendezvous/docteur/${docteurId}/today`);
  }

  updateStatutRendezVous(rendezVousId: number, statut: string): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.apiUrl}/rendezvous/${rendezVousId}/statut`, { statut });
  }

  ajouterNotesRendezVous(rendezVousId: number, notes: string): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.apiUrl}/rendezvous/${rendezVousId}/notes`, { notes });
  }

  // Disponibilités
  getMesDisponibilites(docteurId: number): Observable<Disponibilite[]> {
    return this.http.get<Disponibilite[]>(`${this.apiUrl}/disponibilites/docteur/${docteurId}`);
  }

  ajouterDisponibilite(request: CreateDisponibiliteRequest): Observable<Disponibilite> {
    return this.http.post<Disponibilite>(`${this.apiUrl}/disponibilites`, request);
  }

  supprimerDisponibilite(disponibiliteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disponibilites/${disponibiliteId}`);
  }

  // Statistiques
  getStatistiquesDocteur(docteurId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/docteurs/${docteurId}/statistiques`);
  }
}