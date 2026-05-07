import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ProfileComponent } from '../../../pages/profile/profile.component';

interface DisplayUser {
  name: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-billing-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule],
  templateUrl: './billing-layout.component.html',
  styleUrl: './billing-layout.component.scss',
})
export class BillingLayoutComponent implements OnInit {
  currentUser: DisplayUser = {
    name: 'User',
    role: 'Biller'
  };

  userMenuOpen = false;
  profileDialogVisible = false;
  readonly profileComponent = ProfileComponent;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const authUser = this.auth.currentUser;
    if (authUser) {
      const firstName = authUser.firstName || '';
      const lastName = authUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      this.currentUser = {
        name: fullName || authUser.username || 'User',
        role: this.auth.getRole() || 'Biller',
        firstName: authUser.firstName,
        lastName: authUser.lastName,
      };
    }
  }

  get operationsBaseRoute(): string {
    return this.auth.getOperationsBaseRoute();
  }

  get roleLabel(): string {
    return this.auth.getRole() || this.currentUser.role || 'User';
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
    this.profileDialogVisible = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }
}
