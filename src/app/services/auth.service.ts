import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { LoginRequest, SignupRequest, LoginResponse } from '../models/user';

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
      responseType: 'text'  // Important pour les réponses String
    }
  );
}

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private setRole(role: string): void {
    localStorage.setItem('role', role);
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
}