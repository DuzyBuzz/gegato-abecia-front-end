import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [roleGuard(['biller', 'accounting', 'admin', 'owner'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'contracts',
        canActivate: [roleGuard(['biller', 'accounting', 'admin', 'owner'])],
        loadComponent: () =>
          import('./features/contracts/pages/contract-list/contract-list.component').then(
            (m) => m.ContractListComponent,
          ),
      },
      {
        path: 'contracts/new',
        canActivate: [roleGuard(['biller', 'admin', 'owner'])],
        loadComponent: () =>
          import('./features/contracts/pages/contract-form/contract-form.component').then(
            (m) => m.ContractFormComponent,
          ),
      },
      {
        path: 'clients',
        canActivate: [roleGuard(['biller', 'accounting', 'admin', 'owner'])],
        loadComponent: () => import('./features/clients/clients.component').then((m) => m.ClientsComponent),
      },
      {
        path: 'packages',
        canActivate: [roleGuard(['biller', 'admin', 'owner'])],
        loadComponent: () => import('./features/packages/packages.component').then((m) => m.PackagesComponent),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
