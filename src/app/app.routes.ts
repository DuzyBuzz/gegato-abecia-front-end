import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { AuthorityToCremateRemainsPrinting } from './documents/printing-forms/authority-to-cremate-remains-printing/authority-to-cremate-remains-printing';
import { StatementOfAccount } from './documents/printing-forms/statement-of-account/statement-of-account';
import { FuneralContractEntry } from './documents/entry-forms/funeral-contract-entry/funeral-contract-entry';
import { BillingEntry } from './documents/entry-forms/billing-entry/billing-entry';
import { authGuard, roleGuard } from './guards/auth/auth-guard';
import { DeceasedComponent } from './pages/deceased/deceased.component';
import { BillingLayoutComponent } from './layout/billing-layout/billing-layout.component';

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

  // 🔐 ADMIN (AUTHENTICATED USERS WITH ADMIN ROLE)
  {
    path: 'admin',
    component: MainLayout,
    canActivate: [roleGuard],
    data: { roles: ['Admin'], redirectTo: '/admin/dashboard' },
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: DashboardComponent
      },

      {
        path: 'users',
        component: UsersComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      },

      {
        path: 'deceased',
        component: DeceasedComponent
      },

      // DOCUMENT ENTRY FORMS
      {
        path: 'documents',
        children: [
          {
            path: 'contracts',
            children: [
              {
                path: 'funeral',
                component: FuneralContractEntry
              }
            ]
          },
          {
            path: 'billing',
            component: BillingEntry
          }
        ]
      },

      // DOCUMENT PRINTING
      {
        path: 'print',
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
      }
    ]
  },

  // 🔐 BILLER (AUTHENTICATED USERS WITH BILLER ROLE)
  {
    path: 'billing',
    component: BillingLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: ['Biller'], redirectTo: '/billing/deceased' },
    children: [

      {
        path: '',
        redirectTo: 'deceased',
        pathMatch: 'full'
      },
      {
        path: 'deceased',
        component: DeceasedComponent
      },

      // DOCUMENT ENTRY FORMS
      {
        path: 'documents',
        children: [
          {
            path: 'contracts',
            children: [
              {
                path: 'funeral',
                component: FuneralContractEntry
              }
            ]
          },
          {
            path: 'billing',
            component: BillingEntry
          }
        ]
      },

      // DOCUMENT PRINTING
      {
        path: 'print',
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
      }
    ]
  },

  // FALLBACK
  {
    path: '**',
    redirectTo: 'login'
  }
];
