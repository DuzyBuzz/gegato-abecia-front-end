import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  selector: 'app-accounting-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule],
  templateUrl: './accounting-layout.component.html',
  styleUrl: './accounting-layout.component.scss',
})
export class AccountingLayoutComponent implements OnInit {
  currentUser: DisplayUser = {
    name: 'User',
    role: 'Accounting'
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
        role: this.auth.getRole() || 'Accounting',
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
    return 'Accounting Workspace';
  }

  get workspaceTitle(): string {
    return 'Accounting Workspace';
  }

  get workspaceDescription(): string {
    return 'Review contract records, collections, and statement activity inside a shared operations workspace.';
  }

  get workspaceChipLabel(): string {
    return 'Collections, payment posting, and statement review';
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
