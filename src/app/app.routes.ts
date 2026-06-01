import { Routes } from '@angular/router';
import { MainLayout } from './shared/layout/main-layout/main-layout.component';
import { AdminLayoutComponent } from './shared/layout/admin-layout/admin-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';

import { FuneralContractEntry } from './forms/funeral-contract-entry/funeral-contract-entry';
import { authGuard, roleGuard } from './guards/auth/auth-guard';
import { DeceasedComponent } from './pages/deceased/deceased.component';
import { BillingLayoutComponent } from './shared/layout/billing-layout/billing-layout.component';
import { AccountingLayoutComponent } from './shared/layout/accounting-layout/accounting-layout.component';
import { FuneralBillingComponent } from './forms/funeral-billing/funeral-billing.component';
import { FuneralPaymentComponent } from './forms/funeral-payment/funeral-payment.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { StatementOfAccount } from './document/statement-of-account/statement-of-account';
import { FuneralServiceContractPrinting } from './document/funeral-service-contract-printing/funeral-service-contract-printing';
import { AuthorityToCremateRemainsPrinting } from './document/authority-to-cremate-remains-printing/authority-to-cremate-remains-printing';
import { CremationCertificate } from './document/cremation-certificate/cremation-certificate';
import { EventDetailsInstructionsComponent } from './document/event-details-instructions/event-details-instructions.component';
import { RoleAccess } from './utils/role-access.util';
import { RequestsComponent } from './pages/requests/requests.component';
import { EnclosionsComponent } from './forms/enclosions/enclosions.component';

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
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    data: { roleAccess: [RoleAccess.Admin], redirectTo: '/admin/dashboard' },
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
        data: { roleAccess: [RoleAccess.Admin] }
      },
      {
        path: 'profile',
        component: ProfileComponent
      },

      {
        path: 'deceased',
        component: DeceasedComponent
      },

      {
        path: 'schedule',
        component: ScheduleComponent
      },

      {
        path: 'requests',
        component: RequestsComponent
      },

      {
        path: 'enclosions',
        component: EnclosionsComponent
      },

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
                path: 'billing/:contractId',
                component: FuneralBillingComponent
              },
              {
                path: 'payments/:contractId',
                component: FuneralPaymentComponent
              }
            ]
          }
        ]
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
    data: { roleAccess: [RoleAccess.Biller], redirectTo: '/billing/deceased' },
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
      {
        path: 'schedule',
        component: ScheduleComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
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
                    component: FuneralContractEntry,
                    canActivate: [roleGuard],
                    data: { roleAccess: [RoleAccess.Admin, RoleAccess.Biller], redirectTo: '/billing/deceased' }
                },
                {
                  path: 'funeral-contract/:contractId',
                    component: FuneralContractEntry,
                    canActivate: [roleGuard],
                    data: { roleAccess: [RoleAccess.Biller], redirectTo: '/billing/deceased' }
                },
                {
                  path: 'billing/:contractId',
                    component: FuneralBillingComponent,
                    canActivate: [roleGuard],
                    data: { roleAccess: [RoleAccess.Biller], redirectTo: '/billing/deceased' }
                },
                {
                  path: 'payments/:contractId',
                    component: FuneralPaymentComponent,
                    canActivate: [roleGuard],
                    data: { roleAccess: [RoleAccess.Accounting], redirectTo: '/billing/deceased' }
                }
            ]
          },

        ]
      },


    ]
  },

  {
    path: 'accounting',
    component: AccountingLayoutComponent,
    canActivate: [roleGuard],
    data: { roleAccess: [RoleAccess.Accounting], redirectTo: '/accounting/deceased' },
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
      {
        path: 'schedule',
        component: ScheduleComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'forms',
        children: [
          {
            path: 'contracts',
            children: [
              {
                path: 'funeral-contract/new',
                component: FuneralContractEntry,
                canActivate: [roleGuard],
                data: { roleAccess: [RoleAccess.Biller], redirectTo: '/accounting/deceased' }
              },
              {
                path: 'funeral-contract/:contractId',
                component: FuneralContractEntry,
                canActivate: [roleGuard],
                data: { roleAccess: [RoleAccess.Accounting], redirectTo: '/accounting/deceased' }
              },
              {
                path: 'billing/:contractId',
                component: FuneralBillingComponent,
                canActivate: [roleGuard],
                data: { roleAccess: [RoleAccess.Biller], redirectTo: '/accounting/deceased' }
              },
              {
                path: 'payments/:contractId',
                component: FuneralPaymentComponent,
                canActivate: [roleGuard],
                data: { roleAccess: [RoleAccess.Accounting], redirectTo: '/accounting/deceased' }
              }
            ]
          }
        ]
      }
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
            {
              path: 'funeral-service-contract/:contractId',
              component: FuneralServiceContractPrinting
            },
            {
              path: 'authority-to-cremate-remains/:contractId',
              component: AuthorityToCremateRemainsPrinting
            },
            {
              path: 'cremation-certificate/:contractId',
              component: CremationCertificate
            },
            {
              path: 'event-details-instructions/:contractId',
              component: EventDetailsInstructionsComponent
            },


        ]
      },

  // 🔐 SCHEDULE (ACCESSIBLE FROM ANYWHERE WITH AUTHENTICATION)
  {
    path: 'schedule',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: ScheduleComponent
      }
    ]
  },

  // FALLBACK
  {
    path: '**',
    redirectTo: 'login'
  }
];
