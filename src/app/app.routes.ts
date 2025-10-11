import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { 
    path: 'patient/dashboard', 
    loadComponent: () => import('./pages/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'PATIENT' }
  },
  { 
    path: 'doctor/dashboard', 
    loadComponent: () => import('./pages/doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'DOCTEUR' }
  },
  
];