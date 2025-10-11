import { User } from '../models/user';

export interface Patient extends User {
  dateNaissance?: string;
  telephone?: string;
  adresse?: string;
  numeroSecuriteSociale?: string;
}