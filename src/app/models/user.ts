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
  userId: number;
  message: string;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone?: string;
  adresse?: string;
  actif: boolean;
  dateCreation: string;
  dateModification: string;
}

export interface Patient extends User {
  dateNaissance?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
  photo?: string;
}

export interface Docteur extends User {
  specialite?: Specialite;
  numeroLicence?: string;
  anneesExperience?: number;
  tarifConsultation?: number;
  langue?: string;
  photo?: string;
  noteMoyenne?: number;
  nombreAvis?: number;
}

export interface Admin extends User {
  niveauAcces?: string;
}

export interface Specialite {
  id: number;
  titre: string;
  description: string;
}