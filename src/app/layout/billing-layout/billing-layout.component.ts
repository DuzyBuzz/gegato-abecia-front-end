import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface DisplayUser {
  name: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-billing-layout',
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
        firstName: authUser.firstName,
        lastName: authUser.lastName
      };
    }
  }

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
