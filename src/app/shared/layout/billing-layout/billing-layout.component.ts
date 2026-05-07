import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface DisplayUser {
  name: string;
  role: string;
  companyRole?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
}

@Component({
  selector: 'app-billing-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-layout.component.html',
  styleUrl: './billing-layout.component.scss',
})
export class BillingLayoutComponent implements OnInit {
  currentUser: DisplayUser = {
    name: 'User',
    role: 'Biller'
  };

  userMenuOpen = false;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const authUser = this.auth.currentUser;
    if (authUser) {
      const firstName = authUser.firstName || '';
      const lastName = authUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      this.currentUser = {
        name: fullName || authUser.username || 'User',
        role: authUser.role || 'Biller',
        companyRole: authUser.companyRole,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        position: authUser.position,
      };
    }
  }

  get operationsBaseRoute(): string {
    return this.auth.getOperationsBaseRoute();
  }

  get roleLabel(): string {
    const mappedStoredRole = this.mapDisplayRole(this.currentUser.role);
    if (mappedStoredRole) {
      return mappedStoredRole;
    }

    const mappedCompanyRole = this.mapDisplayRole(this.currentUser.companyRole);
    if (mappedCompanyRole) {
      return mappedCompanyRole;
    }

    if (this.auth.isAdmin()) {
      return 'Admin';
    }

    if (this.auth.isAccounting()) {
      return 'Accounting';
    }

    if (this.auth.isBiller()) {
      return 'Biller';
    }

    return this.currentUser.role || 'User';
  }

  private mapDisplayRole(value: string | undefined): string | null {
    const normalized = String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ');

    if (!normalized) {
      return null;
    }

    if (normalized.includes('accounting') || normalized.includes('accountant')) {
      return 'Accounting';
    }

    if (normalized.includes('admin')) {
      return 'Admin';
    }

    if (normalized.includes('biller') || normalized.includes('staff') || normalized.includes('collector') || normalized.includes('super user')) {
      return 'Biller';
    }

    return null;
  }

  get profileRoute(): string {
    return this.auth.getProfileRoute();
  }

  get workspaceEyebrow(): string {
    return this.roleLabel === 'Accounting' ? 'Accounting Workspace' : 'Billing Workspace';
  }

  get workspaceTitle(): string {
    return this.roleLabel === 'Accounting' ? 'Accounting Workspace' : 'Biller Workspace';
  }

  get workspaceDescription(): string {
    return this.roleLabel === 'Accounting'
      ? ''
      : '';
  }

  get workspaceChipLabel(): string {
    return this.roleLabel === 'Accounting'
      ? 'Collections, payment posting, and statement review'
      : 'Contract intake, charge encoding, and case coordination';
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  formatUserName(name: string): string {
    if (!name) {
      return '';
    }

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0];
    }

    return `${parts[0]} ${parts.slice(1).map((part) => `${part.charAt(0).toUpperCase()}.`).join(' ')}`;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.auth.logout();
    this.userMenuOpen = false;
    this.router.navigate(['/login']);
  }

  openProfile(): void {
    this.userMenuOpen = false;
    this.router.navigateByUrl(this.profileRoute);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }
}
