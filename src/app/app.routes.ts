import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { AuthorityToCremateRemainsPrinting } from './documents/printing-forms/authority-to-cremate-remains-printing/authority-to-cremate-remains-printing';
import { StatementOfAccount } from './documents/printing-forms/statement-of-account/statement-of-account';
import { FuneralContractEntry } from './documents/entry-forms/funeral-contract-entry/funeral-contract-entry';
import { BillingEntry } from './documents/entry-forms/billing-entry/billing-entry';

export const routes: Routes = [

  // DEFAULT
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // AUTH
  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'printing',
    children: [
      {
        path: 'authority-to-cremate-remains',
        component: AuthorityToCremateRemainsPrinting
      },
            {
        path: 'statement-of-account',
        component: StatementOfAccount
      }
    ]
  },
    {
    path: 'entry-forms',
    children: [
      {
        path: 'statements-of-account',
        component: BillingEntry
      },
            {
        path: '',
        component: StatementOfAccount
      }
    ]
  },
  // ADMIN AREA
  {
    path: 'admin',
    component: MainLayout,
    children: [

      // /admin → redirect to dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // /admin/dashboard
      {
        path: 'dashboard',
        component: DashboardComponent
      },

      // /admin/users
      {
        path: 'users',
        component: UsersComponent
      }
    ]
  }
];
