import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, UserRole } from '../models/auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly mockUsers: Record<string, AuthUser> = {
    'biller@gegato.test': { id: 'u-biller', email: 'biller@gegato.test', name: 'Biller User', role: 'biller', branchId: 'branch-001' },
    'accounting@gegato.test': { id: 'u-accounting', email: 'accounting@gegato.test', name: 'Accounting User', role: 'accounting', branchId: 'branch-001' },
    'admin@gegato.test': { id: 'u-admin', email: 'admin@gegato.test', name: 'Admin User', role: 'admin', branchId: 'branch-all' },
    'owner@gegato.test': { id: 'u-owner', email: 'owner@gegato.test', name: 'Owner User', role: 'owner', branchId: 'branch-all' },
  };

  readonly currentUser = signal<AuthUser | null>(this.readStoredUser());

  constructor(private readonly router: Router) {}

  async signIn(email: string, password: string): Promise<AuthUser | null> {
    const user = this.mockUsers[email.trim().toLowerCase()];
    if (!user || password.trim().length < 1) {
      return null;
    }

    this.currentUser.set(user);
    localStorage.setItem('gegato-current-user', JSON.stringify(user));
    return user;
  }

  signOut(): void {
    this.currentUser.set(null);
    localStorage.removeItem('gegato-current-user');
    this.router.navigateByUrl('/login');
  }

  hasRole(role: UserRole | UserRole[]): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }

    const allowedRoles = Array.isArray(role) ? role : [role];
    return allowedRoles.includes(user.role);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('gegato-current-user');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem('gegato-current-user');
      return null;
    }
  }
}
