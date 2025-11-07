import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';

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
}

export interface Disponibilite {
  id: number;
  dateHeureDebut: string;
  dateHeureFin: string;
  disponible: boolean;
  motifIndisponibilite?: string;
  docteur: any;
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
  specialite: any;
  anneesExperience: number;
  tarifConsultation: number;
  noteMoyenne: number;
  nombreAvis: number;
  photo?: string;
  telephone?: string;
  adresse?: string;
  numeroLicence?: string;
  langue?: string;
  dateCreation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenService.getToken();
    
    if (token && !this.tokenService.isTokenExpired()) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    } else {
      if (token) {
        this.authService.logout();
      }
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error('🔴 API Error:', error);
    console.error('🔴 URL:', error.url);
    console.error('🔴 Status:', error.status);
    
    if (error.status === 401 || error.status === 403) {
      console.error('🔴 Erreur d\'authentification - Redirection vers login');
      this.authService.logout();
      window.location.href = '/login';
      return throwError(() => new Error('Session expirée - Veuillez vous reconnecter'));
    }
    
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    } else if (error.status === 403) {
      errorMessage = 'Accès refusé - Vous n\'avez pas les permissions nécessaires';
    } else if (error.status === 404) {
      errorMessage = 'Ressource non trouvée';
    } else if (error.status === 500) {
      errorMessage = 'Erreur interne du serveur';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // ==================== MÉTHODES DE DÉBOGAGE ====================

  testConnexion(): Observable<any> {
    const docteurId = this.authService.getUserId();
    console.log('🧪 Test de connexion pour docteur:', docteurId);
    
    return this.http.get(
      `${this.apiUrl}/docteurs/${docteurId}/sante`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== RENDEZ-VOUS ====================

  getMesRendezVous(docteurId: number): Observable<RendezVous[]> {
    console.log('📅 Chargement des rendez-vous pour docteur:', docteurId);
    return this.http.get<RendezVous[]>(
      `${this.apiUrl}/rendezvous/docteur/${docteurId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getRendezVousAujourdhui(docteurId: number): Observable<RendezVous[]> {
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Chargement des rendez-vous aujourd\'hui:', today);
    return this.http.get<RendezVous[]>(
      `${this.apiUrl}/rendezvous/docteur/${docteurId}/date/${today}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getRendezVousParDate(docteurId: number, date: string): Observable<RendezVous[]> {
    console.log('📅 Chargement des rendez-vous pour date:', date);
    return this.http.get<RendezVous[]>(
      `${this.apiUrl}/rendezvous/docteur/${docteurId}/date/${date}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getRendezVousParStatut(docteurId: number, statut: string): Observable<RendezVous[]> {
    console.log('📅 Chargement des rendez-vous par statut:', statut);
    return this.http.get<RendezVous[]>(
      `${this.apiUrl}/rendezvous/docteur/${docteurId}/statut/${statut}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  confirmerRendezVous(rendezVousId: number): Observable<RendezVous> {
    console.log('✅ Confirmation du rendez-vous:', rendezVousId);
    return this.http.put<RendezVous>(
      `${this.apiUrl}/rendezvous/${rendezVousId}/confirmer`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  terminerRendezVous(rendezVousId: number): Observable<RendezVous> {
    console.log('🏁 Finalisation du rendez-vous:', rendezVousId);
    return this.http.put<RendezVous>(
      `${this.apiUrl}/rendezvous/${rendezVousId}/terminer`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  annulerRendezVous(rendezVousId: number): Observable<RendezVous> {
    console.log('❌ Annulation du rendez-vous:', rendezVousId);
    return this.http.put<RendezVous>(
      `${this.apiUrl}/rendezvous/${rendezVousId}/annuler`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  ajouterNotesRendezVous(rendezVousId: number, notes: string): Observable<RendezVous> {
    console.log('📝 Ajout de notes au rendez-vous:', rendezVousId);
    return this.http.put<RendezVous>(
      `${this.apiUrl}/rendezvous/${rendezVousId}/notes`,
      { notes },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== DISPONIBILITÉS ====================

  getMesDisponibilites(docteurId: number): Observable<Disponibilite[]> {
    console.log('📋 Chargement des disponibilités pour docteur:', docteurId);
    return this.http.get<Disponibilite[]>(
      `${this.apiUrl}/disponibilites/docteur/${docteurId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getDisponibilitesFutures(docteurId: number): Observable<Disponibilite[]> {
    console.log('📋 Chargement des disponibilités futures pour docteur:', docteurId);
    return this.http.get<Disponibilite[]>(
      `${this.apiUrl}/disponibilites/docteur/${docteurId}/futures`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  ajouterDisponibilite(request: CreateDisponibiliteRequest): Observable<Disponibilite> {
    console.log('➕ Ajout d\'une disponibilité:', request);
    return this.http.post<Disponibilite>(
      `${this.apiUrl}/disponibilites`,
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  ajouterIndisponibilite(request: DisponibiliteRequest): Observable<Disponibilite> {
    console.log('➖ Ajout d\'une indisponibilité:', request);
    return this.http.post<Disponibilite>(
      `${this.apiUrl}/disponibilites/indisponible`,
      request,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  supprimerDisponibilite(disponibiliteId: number): Observable<void> {
    console.log('🗑️ Suppression de la disponibilité:', disponibiliteId);
    return this.http.delete<void>(
      `${this.apiUrl}/disponibilites/${disponibiliteId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  genererDisponibilitesSemaine(docteurId: number, dateDebut: string): Observable<Disponibilite[]> {
    console.log('📅 Génération des disponibilités de la semaine:', dateDebut);
    return this.http.post<Disponibilite[]>(
      `${this.apiUrl}/disponibilites/docteur/${docteurId}/generer-semaine?dateDebutSemaine=${dateDebut}`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  verifierDisponibilite(docteurId: number, dateHeure: string): Observable<boolean> {
    console.log('🔍 Vérification disponibilité:', dateHeure);
    return this.http.get<boolean>(
      `${this.apiUrl}/disponibilites/docteur/${docteurId}/disponible?dateHeure=${dateHeure}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getCreneauxDisponibles(docteurId: number, dateDebut: string, dateFin: string): Observable<string[]> {
    console.log('🔍 Récupération des créneaux disponibles:', dateDebut, 'à', dateFin);
    return this.http.get<string[]>(
      `${this.apiUrl}/disponibilites/docteur/${docteurId}/creneaux?dateDebut=${dateDebut}&dateFin=${dateFin}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== PROFIL DOCTEUR ====================

  getMonProfil(docteurId: number): Observable<Docteur> {
    console.log('👤 Chargement du profil docteur:', docteurId);
    return this.http.get<Docteur>(
      `${this.apiUrl}/docteurs/${docteurId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateMonProfil(docteurId: number, profil: UpdateDocteurRequest): Observable<Docteur> {
    console.log('✏️ Mise à jour du profil docteur:', docteurId, profil);
    return this.http.put<Docteur>(
      `${this.apiUrl}/docteurs/${docteurId}`,
      profil,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  updatePhotoProfil(docteurId: number, photo: File): Observable<Docteur> {
    console.log('🖼️ Mise à jour photo profil:', docteurId);
    
    const formData = new FormData();
    formData.append('photo', photo);
    
    const token = this.tokenService.getToken();
    let headers = new HttpHeaders();
    if (token && !this.tokenService.isTokenExpired()) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.put<Docteur>(
      `${this.apiUrl}/docteurs/${docteurId}/photo`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getSpecialites(): Observable<Specialite[]> {
    console.log('🎯 Chargement des spécialités');
    return this.http.get<Specialite[]>(
      `${this.apiUrl}/specialites`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== STATISTIQUES ====================

  getStatistiquesDocteur(docteurId: number): Observable<StatistiquesDocteur> {
    console.log('📊 Chargement des statistiques pour docteur:', docteurId);
    return this.http.get<StatistiquesDocteur>(
      `${this.apiUrl}/docteurs/${docteurId}/statistiques`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getStatistiquesMensuelles(docteurId: number, annee: number, mois: number): Observable<any> {
    console.log('📊 Chargement des statistiques mensuelles:', annee, mois);
    return this.http.get<any>(
      `${this.apiUrl}/docteurs/${docteurId}/statistiques/mensuelles?annee=${annee}&mois=${mois}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getEvolutionRendezVous(docteurId: number, dateDebut: string, dateFin: string): Observable<any> {
    console.log('📈 Chargement de l\'évolution des rendez-vous:', dateDebut, 'à', dateFin);
    return this.http.get<any>(
      `${this.apiUrl}/docteurs/${docteurId}/statistiques/evolution?dateDebut=${dateDebut}&dateFin=${dateFin}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== PATIENTS ====================

  getMesPatients(docteurId: number): Observable<Patient[]> {
    console.log('👥 Chargement des patients pour docteur:', docteurId);
    return this.http.get<Patient[]>(
      `${this.apiUrl}/docteurs/${docteurId}/patients`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getNouveauxPatients(docteurId: number): Observable<Patient[]> {
    console.log('👥 Chargement des nouveaux patients pour docteur:', docteurId);
    return this.http.get<Patient[]>(
      `${this.apiUrl}/docteurs/${docteurId}/patients/nouveaux`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getPatientDetails(docteurId: number, patientId: number): Observable<Patient> {
    console.log('👤 Chargement des détails du patient:', patientId);
    return this.http.get<Patient>(
      `${this.apiUrl}/docteurs/${docteurId}/patients/${patientId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getHistoriquePatient(docteurId: number, patientId: number): Observable<RendezVous[]> {
    console.log('📋 Chargement de l\'historique du patient:', patientId);
    return this.http.get<RendezVous[]>(
      `${this.apiUrl}/docteurs/${docteurId}/patients/${patientId}/historique`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== AGENDA ====================

  getAgenda(docteurId: number, dateDebut: string, dateFin: string): Observable<any[]> {
    console.log('📅 Chargement de l\'agenda:', dateDebut, 'à', dateFin);
    return this.http.get<any[]>(
      `${this.apiUrl}/docteurs/${docteurId}/agenda?dateDebut=${dateDebut}&dateFin=${dateFin}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getEvenementsAgenda(docteurId: number, date: string): Observable<any[]> {
    console.log('📅 Chargement des événements agenda pour:', date);
    return this.http.get<any[]>(
      `${this.apiUrl}/docteurs/${docteurId}/agenda/date/${date}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== RAPPORTS ====================

  genererRapportActivite(docteurId: number, dateDebut: string, dateFin: string): Observable<Blob> {
    console.log('📄 Génération rapport activité:', dateDebut, 'à', dateFin);
    return this.http.get(
      `${this.apiUrl}/docteurs/${docteurId}/rapports/activite?dateDebut=${dateDebut}&dateFin=${dateFin}`,
      { 
        headers: this.getAuthHeaders(),
        responseType: 'blob' 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  genererRapportFinancier(docteurId: number, annee: number, mois: number): Observable<Blob> {
    console.log('💰 Génération rapport financier:', annee, mois);
    return this.http.get(
      `${this.apiUrl}/docteurs/${docteurId}/rapports/financier?annee=${annee}&mois=${mois}`,
      { 
        headers: this.getAuthHeaders(),
        responseType: 'blob' 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== UTILITAIRES ====================

  rechercherPatients(docteurId: number, query: string): Observable<Patient[]> {
    console.log('🔍 Recherche de patients:', query);
    return this.http.get<Patient[]>(
      `${this.apiUrl}/docteurs/${docteurId}/patients/recherche?q=${encodeURIComponent(query)}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  verifierConflitRendezVous(docteurId: number, dateHeure: string, duree: number = 30): Observable<boolean> {
    console.log('⚡ Vérification conflit rendez-vous:', dateHeure);
    return this.http.get<boolean>(
      `${this.apiUrl}/docteurs/${docteurId}/verifier-conflit?dateHeure=${dateHeure}&duree=${duree}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getRendezVousAvenir(docteurId: number): Observable<RendezVous[]> {
    const dateDebut = new Date().toISOString().split('T')[0];
    const dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + 7);
    const dateFinStr = dateFin.toISOString().split('T')[0];
    
    console.log('🔮 Rendez-vous à venir:', dateDebut, 'à', dateFinStr);
    
    return this.http.get<RendezVous[]>(
      `${this.apiUrl}/rendezvous/docteur/${docteurId}/periode?dateDebut=${dateDebut}&dateFin=${dateFinStr}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== NOTIFICATIONS ====================

  getNotifications(docteurId: number): Observable<any[]> {
    console.log('🔔 Chargement des notifications pour docteur:', docteurId);
    return this.http.get<any[]>(
      `${this.apiUrl}/docteurs/${docteurId}/notifications`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  marquerNotificationLue(docteurId: number, notificationId: number): Observable<void> {
    console.log('✅ Marquer notification comme lue:', notificationId);
    return this.http.put<void>(
      `${this.apiUrl}/docteurs/${docteurId}/notifications/${notificationId}/lu`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getNombreNotificationsNonLues(docteurId: number): Observable<number> {
    console.log('🔔 Nombre de notifications non lues pour docteur:', docteurId);
    return this.http.get<number>(
      `${this.apiUrl}/docteurs/${docteurId}/notifications/non-lues`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }
}