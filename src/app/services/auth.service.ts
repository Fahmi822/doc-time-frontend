import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { LoginRequest, SignupRequest, LoginResponse } from '../models/user';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

interface JwtPayload {
  sub: string;
  userId: number;
  role: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
  console.log('🔐 Tentative de connexion vers:', `${this.apiUrl}/login`);
  
  return this.http.post<LoginResponse>(
    `${this.apiUrl}/login`, 
    credentials, 
    this.getHttpOptions()
  ).pipe(
    tap(response => {
      console.log('✅ Réponse login reçue:', response);
      
      // VÉRIFICATION ROBUSTE des données
      if (!response) {
        console.error('❌ Réponse vide du serveur');
        return;
      }
      
      if (response.token && response.userId && response.role) {
        this.setToken(response.token);
        this.setRole(response.role);
        this.setUserId(response.userId);
        console.log('👤 Utilisateur connecté - Role:', response.role, 'ID:', response.userId);
        
        this.redirectAfterLogin(response.role);
      } else {
        console.error('❌ Données manquantes dans la réponse:', {
          token: !!response.token,
          userId: response.userId,
          role: response.role
        });
        // Stocker quand même les données disponibles
        if (response.token) this.setToken(response.token);
        if (response.role) this.setRole(response.role);
        if (response.userId) this.setUserId(response.userId);
      }
    })
  );
}

  private redirectAfterLogin(role: string): void {
    switch (role.toUpperCase()) {
      case 'PATIENT':
        this.router.navigate(['/patient/dashboard']);
        break;
      case 'DOCTEUR':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  signup(userData: SignupRequest): Observable<any> {
    console.log('📝 Inscription vers:', `${this.apiUrl}/signup`);
    
    return this.http.post(
      `${this.apiUrl}/signup`, 
      userData, 
      { 
        ...this.getHttpOptions(),
        responseType: 'text' as 'json'
      }
    );
  }
  signupDoctor(doctorData: any): Observable<any> {
  const url = `${this.apiUrl}/signup/docteur`; // ← CHANGÉ ICI
  console.log('📝 Inscription docteur vers:', url, doctorData);
  
  return this.http.post(
    url, 
    doctorData, 
    { 
      ...this.getHttpOptions(),
      responseType: 'text' as 'json'
    }
  );
}


  logout(): void {
    console.log('🚪 Déconnexion utilisateur');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    // Vérifier l'expiration du token
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    
    return true;
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private setRole(role: string): void {
    localStorage.setItem('role', role);
  }

  private setUserId(userId: number): void {
    localStorage.setItem('userId', userId.toString());
  }

  isPatient(): boolean {
    return this.getRole() === 'PATIENT';
  }

  isDoctor(): boolean {
    return this.getRole() === 'DOCTEUR';
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded: JwtPayload = jwtDecode(token);
      const exp = decoded.exp * 1000;
      return Date.now() >= exp;
    } catch (error) {
      console.error('Erreur vérification token:', error);
      return true;
    }
  }

  // Méthode pour rafraîchir les infos utilisateur depuis le token
  refreshUserInfo(): void {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        this.setRole(decoded.role);
        this.setUserId(decoded.userId);
      } catch (error) {
        console.error('Erreur rafraîchissement info utilisateur:', error);
        this.logout();
      }
    }
  }
  private getRoleFromToken(): string | null {
  const token = this.getToken();
  if (!token) return null;
  
  try {
    const decoded: JwtPayload = jwtDecode(token);
    return decoded.role || null;
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
}
}