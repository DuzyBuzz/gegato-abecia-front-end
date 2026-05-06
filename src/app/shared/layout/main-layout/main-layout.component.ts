import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface DisplayUser {
  name: string;
  role: string;
  firstName?: string;
  lastName?: string;
  position?: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayout implements OnInit {
  sidebarExpanded = true;
  isUserMenuOpen = false;
  currentUser: DisplayUser = { name: 'User', role: 'Guest' };

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const authUser = this.auth.currentUser;
    if (authUser) {
      const firstName = authUser.firstName || '';
      const lastName = authUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      this.currentUser = {
        name: fullName || authUser.username || 'User',
        role: authUser.role || 'User',
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        position: authUser.position
      };
    }
  }

  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  openProfile(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/admin/profile']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.isUserMenuOpen = false;
    }
  }

  formatUserName(fullName: string): string {
    if (!fullName) return '';

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0];
    }

    const firstName = parts[0];
    const initials = parts
      .slice(1)
      .map(p => p.charAt(0).toUpperCase() + '.')
      .join(' ');

    return `${firstName} ${initials}`;
  }

  getUserInitials(fullName: string): string {
    if (!fullName) return '';

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0).toUpperCase() +
      parts[1].charAt(0).toUpperCase()
    );
  }
}

