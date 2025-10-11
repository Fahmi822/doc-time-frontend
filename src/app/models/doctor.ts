import { User } from '../models/user';

export interface Doctor extends User {
  specialite?: string;
  numeroOrdre?: string;
  telephone?: string;
  adresseCabinet?: string;
  tarifConsultation?: number;
  experience?: number;
}