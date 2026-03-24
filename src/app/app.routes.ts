import { Routes } from '@angular/router';
import { MainLayout } from './shared/layout/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';

import { FuneralContractEntry } from './forms/funeral-contract-entry/funeral-contract-entry';
import { authGuard, roleGuard } from './guards/auth/auth-guard';
import { DeceasedComponent } from './pages/deceased/deceased.component';
import { BillingLayoutComponent } from './shared/layout/billing-layout/billing-layout.component';
import { FuneralPaymentComponent } from './forms/funeral-payment/funeral-payment.component';
import { StatementOfAccount } from './document/statement-of-account/statement-of-account';

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
                path: 'funeral/:contractId',
                component: FuneralContractEntry
              }
            ]
          },

        ]
      },

      // DOCUMENT PRINTING
      {
        path: 'print',
        children: [

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
        path: 'forms',
        children: [
          {
            path: 'contracts',
            children: [
                {
                  path: 'funeral-contract/new',
                  component: FuneralContractEntry
                },
                {
                  path: 'funeral-contract/:contractId',
                  component: FuneralContractEntry
                },
                {
                  path: 'payments/:contractId',
                  component: FuneralPaymentComponent
                }
            ]
          },

        ]
      },


    ]
  },

      // DOCUMENT PRINTING
      {
        path: 'print',
        children: [
            {
              path: 'statement-of-account/:contractId',
              component: StatementOfAccount
            },


        ]
      },
  // FALLBACK
  {
    path: '**',
    redirectTo: 'login'
  }
];
