export interface User {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface SignupRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  message: string;
}