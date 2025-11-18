import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

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
export class TokenService {

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded: JwtPayload = jwtDecode(token);
      const exp = decoded.exp * 1000;
      return Date.now() >= exp;
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return true;
    }
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: JwtPayload = jwtDecode(token);
      return decoded.userId;
    } catch (error) {
      console.error('Erreur extraction userId:', error);
      return null;
    }
  }

  getRole(): string {
    const token = this.getToken();
    if (!token) return '';

    try {
      const decoded: JwtPayload = jwtDecode(token);
      return decoded.role;
    } catch (error) {
      console.error('Erreur extraction role:', error);
      return '';
    }
  }

  decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Erreur décodage complet token:', error);
      return null;
    }
  }

  hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  getTimeUntilExpiration(): number {
    const token = this.getToken();
    if (!token) return 0;

    try {
      const decoded: JwtPayload = jwtDecode(token);
      const exp = decoded.exp * 1000;
      const now = Date.now();
      return Math.max(0, Math.round((exp - now) / 1000 / 60));
    } catch (error) {
      return 0;
    }
  }
}