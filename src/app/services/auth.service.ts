import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api = `${environment.api}/ua_control`;

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {

    // Step 1: find user by username
    return this.http.get<any>(`${this.api}/find_record/${username}`).pipe(
      tap(user => {
        console.log('[AuthService] API RESPONSE:', user);

        if (!user) {
          throw new Error('User not found');
        }

        // Step 2: compare password
        // ⚠️ If backend returns encrypted → you must encrypt input too
        if (user.password !== password) {
          throw new Error('Invalid password');
        }

        // Step 3: normalize user
        const mappedUser = {
          id: user.id,
          username: user.accountNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          role: this.mapRole(user.companyRole), // important
        };

        localStorage.setItem('user', JSON.stringify(mappedUser));
      })
    );
  }

private mapRole(role: string): string {
  switch (role) {
    case 'SUPER_USER':
      return 'Biller';
    default:
      return 'User';
  }
}

  logout() {
    localStorage.removeItem('user');
  }

  get currentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  getRole(): string | null {
    return this.currentUser?.role ?? null;
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.getRole();
    return role ? allowedRoles.includes(role) : false;
  }
}
