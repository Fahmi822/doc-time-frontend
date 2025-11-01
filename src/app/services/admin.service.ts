import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
  dateCreation: string;
  telephone?: string;
  adresse?: string;
}

export interface StatistiquesGlobales {
  totalUtilisateurs: number;
  totalPatients: number;
  totalDocteurs: number;
  totalRendezVous: number;
  rendezVousAujourdhui: number;
  revenuMensuel: number;
  tauxOccupation: number;
}

export interface RendezVousAdmin {
  id: number;
  dateHeure: string;
  statut: string;
  motif: string;
  patient: Utilisateur;
  docteur: Utilisateur;
  dateCreation: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Statistiques
  getStatistiquesGlobales(): Observable<StatistiquesGlobales> {
    return this.http.get<StatistiquesGlobales>(`${this.apiUrl}/admin/statistiques`);
  }

  // Utilisateurs
  getAllUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/utilisateurs`);
  }

  getUtilisateursByRole(role: string): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/admin/utilisateurs/role/${role}`);
  }

  createUtilisateur(utilisateur: any): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/admin/utilisateurs`, utilisateur);
  }

  updateUtilisateur(id: number, utilisateur: any): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.apiUrl}/admin/utilisateurs/${id}`, utilisateur);
  }

  toggleUtilisateurActif(id: number): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/admin/utilisateurs/${id}/toggle-actif`, {});
  }

  deleteUtilisateur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/utilisateurs/${id}`);
  }

  // Rendez-vous
  getAllRendezVous(): Observable<RendezVousAdmin[]> {
    return this.http.get<RendezVousAdmin[]>(`${this.apiUrl}/admin/rendezvous`);
  }

  getRendezVousRecent(): Observable<RendezVousAdmin[]> {
    return this.http.get<RendezVousAdmin[]>(`${this.apiUrl}/admin/rendezvous/recent`);
  }

  // Rapports
  getRapportMensuel(mois: number, annee: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/rapports/mensuel/${annee}/${mois}`);
  }

  // Logs
  getLogsActivite(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/logs`);
  }
}