import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token && this.authService.isLoggedIn()) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('🔑 Token ajouté aux headers Admin');
    } else {
      console.warn('⚠️ Aucun token valide pour AdminService');
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('🔴 Erreur API Admin:', error);
    console.error('🔴 URL:', error.url);
    console.error('🔴 Status:', error.status);
    
    if (error.status === 0) {
      return throwError(() => new Error('ERREUR RÉSEAU: Impossible de se connecter au serveur backend.'));
    } else if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('Session expirée - Veuillez vous reconnecter'));
    } else if (error.status === 403) {
      return throwError(() => new Error('Accès refusé - Réservé aux administrateurs'));
    }
    
    const errorMessage = error.error?.message || error.message || 'Une erreur est survenue';
    return throwError(() => new Error(errorMessage));
  }

  // Statistiques
  getStatistiquesGlobales(): Observable<StatistiquesGlobales> {
    const url = `${this.apiUrl}/admin/statistiques`;
    console.log('📊 GET Statistiques globales:', url);
    
    return this.http.get<StatistiquesGlobales>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(stats => console.log('✅ Statistiques reçues:', stats)),
      catchError(this.handleError.bind(this))
    );
  }

  // Utilisateurs
  getAllUtilisateurs(): Observable<Utilisateur[]> {
    const url = `${this.apiUrl}/admin/utilisateurs`;
    console.log('📥 GET Tous les utilisateurs:', url);
    
    return this.http.get<Utilisateur[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(users => console.log(`✅ ${users.length} utilisateurs reçus`)),
      catchError(this.handleError.bind(this))
    );
  }

  getUtilisateursByRole(role: string): Observable<Utilisateur[]> {
    const url = `${this.apiUrl}/admin/utilisateurs/role/${role}`;
    console.log('📥 GET Utilisateurs par rôle:', url);
    
    return this.http.get<Utilisateur[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  createUtilisateur(utilisateur: any): Observable<Utilisateur> {
    const url = `${this.apiUrl}/admin/utilisateurs`;
    console.log('➕ POST Créer utilisateur:', url, utilisateur);
    
    return this.http.post<Utilisateur>(url, utilisateur, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  updateUtilisateur(id: number, utilisateur: any): Observable<Utilisateur> {
    const url = `${this.apiUrl}/admin/utilisateurs/${id}`;
    console.log('📝 PUT Modifier utilisateur:', url, utilisateur);
    
    return this.http.put<Utilisateur>(url, utilisateur, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  toggleUtilisateurActif(id: number): Observable<Utilisateur> {
    const url = `${this.apiUrl}/admin/utilisateurs/${id}/toggle-actif`;
    console.log('🔄 PATCH Toggle actif:', url);
    
    return this.http.patch<Utilisateur>(url, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  deleteUtilisateur(id: number): Observable<void> {
    const url = `${this.apiUrl}/admin/utilisateurs/${id}`;
    console.log('🗑️ DELETE Utilisateur:', url);
    
    return this.http.delete<void>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // Rendez-vous
  getAllRendezVous(): Observable<RendezVousAdmin[]> {
    const url = `${this.apiUrl}/admin/rendezvous`;
    console.log('📥 GET Tous les rendez-vous:', url);
    
    return this.http.get<RendezVousAdmin[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getRendezVousRecent(): Observable<RendezVousAdmin[]> {
    const url = `${this.apiUrl}/admin/rendezvous/recent`;
    console.log('📥 GET Rendez-vous récents:', url);
    
    return this.http.get<RendezVousAdmin[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // Rapports
  getRapportMensuel(mois: number, annee: number): Observable<any> {
    const url = `${this.apiUrl}/admin/rapports/mensuel/${annee}/${mois}`;
    console.log('📄 GET Rapport mensuel:', url);
    
    return this.http.get<any>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // Logs
  getLogsActivite(): Observable<any[]> {
    const url = `${this.apiUrl}/admin/logs`;
    console.log('📋 GET Logs activité:', url);
    
    return this.http.get<any[]>(url, { 
      headers: this.getAuthHeaders() 
    }).pipe(catchError(this.handleError.bind(this)));
  }
}