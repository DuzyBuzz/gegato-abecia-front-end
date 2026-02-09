import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface User {
  name: string;
  role: string;
}

@Component({
  selector: 'app-billing-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-layout.component.html',
  styleUrl: './billing-layout.component.scss',
})
export class BillingLayoutComponent {
  currentUser: User = {
    name: 'John Doe',
    role: 'Administrator',
  };

  userMenuOpen = false;

  constructor(private router: Router, private auth: AuthService) {}

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase();
  }

  formatUserName(name: string): string {
    return name;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  logout(): void {
    console.log('Logging out...');
    this.auth.logout();
    this.userMenuOpen = false;
    this.router.navigate(['/login']);
  }

  openSettings(): void {
    // Handle settings navigation
    console.log('Opening settings...');
    this.userMenuOpen = false;
    // this.router.navigate(['/settings']);
  }
}
