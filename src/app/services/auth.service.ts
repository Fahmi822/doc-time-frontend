import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { LoginRequest, SignupRequest, LoginResponse } from '../models/user';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string; // email
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

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('Tentative de connexion vers:', `${this.apiUrl}/login`);
    console.log('Données envoyées:', credentials);
    
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`, 
      credentials, 
      this.getHttpOptions()
    ).pipe(
      tap(response => {
        console.log('Réponse reçue:', response);
        if (response.token) {
          this.setToken(response.token);
          this.setRole(response.role);
          this.setUserId(response.token); // Décode et stocke l'ID utilisateur
        }
      })
    );
  }

  signup(userData: SignupRequest): Observable<any> {
    console.log('Inscription vers:', `${this.apiUrl}/signup`);
    console.log('Données envoyées:', userData);
    
    return this.http.post(
      `${this.apiUrl}/signup`, 
      userData, 
      { 
        ...this.getHttpOptions(),
        responseType: 'text' as 'json'
      }
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
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

  private setUserId(token: string): void {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      if (decoded.userId) {
        localStorage.setItem('userId', decoded.userId.toString());
      } else {
        console.warn('Aucun userId trouvé dans le token JWT');
      }
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
    }
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
      return true;
    }
  }

  // Méthode pour rafraîchir les informations utilisateur
  refreshUserInfo(): void {
    const token = this.getToken();
    if (token) {
      this.setUserId(token);
    }
  }
}