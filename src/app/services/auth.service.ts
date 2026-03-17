import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, tap } from 'rxjs';
import { USERS_MOCK } from '../../assets/mock/users.mock';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api = 'http://localhost:8080/api/auth/';

  constructor(private http: HttpClient) {}

  /**
   * Login with local mock or backend API
   * First tries mock authentication, then falls back to API
   */
  login(username: string, password: string) {

    console.log('[AuthService] login() called');
    console.log('[AuthService] username:', username);

    // Try local mock authentication first
    const mockUser = USERS_MOCK.find(u => u.username === username && u.password === password);

    if (mockUser) {
      console.log('[AuthService] Mock user found - authenticating locally');
      
      const user = {
        userId: mockUser.userId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        username: mockUser.username,
        position: mockUser.position,
        role: mockUser.role
      };

      return of(user).pipe(
        tap({
          next: (user) => {
            console.log('[AuthService] Mock login SUCCESS');
            console.log('[AuthService] response:', user);

            localStorage.setItem('user', JSON.stringify(user));

            console.log('[AuthService] user saved to localStorage');
            console.log('[AuthService] localStorage user:', localStorage.getItem('user'));
          },
          error: (err) => {
            console.error('[AuthService] Mock login FAILED');
            console.error('[AuthService] error:', err);
          }
        })
      );
    }

    // Fall back to backend API
    console.log('[AuthService] No mock user found - sending request to:', `${this.api}/login`);

    return this.http.post<any>(`${this.api}/login`, {
      userName: username, 
      password
    }).pipe(
      tap({
        next: (user) => {
          console.log('[AuthService] API login SUCCESS');
          console.log('[AuthService] response:', user);

          localStorage.setItem('user', JSON.stringify(user));

          console.log('[AuthService] user saved to localStorage');
          console.log('[AuthService] localStorage user:', localStorage.getItem('user'));
        },
        error: (err) => {
          console.error('[AuthService] API login FAILED');
          console.error('[AuthService] error:', err);
        }
      })
    );
  }

  logout() {
    console.log('[AuthService] logout() called');

    localStorage.removeItem('user');

    console.log('[AuthService] user removed from localStorage');
  }

  get currentUser() {
    const user = localStorage.getItem('user');

    console.log('[AuthService] currentUser getter called');
    console.log('[AuthService] raw localStorage value:', user);

    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    const loggedIn = !!this.currentUser;

    console.log('[AuthService] isLoggedIn():', loggedIn);

    return loggedIn;
  }

  getRole(): string | null {
    return this.currentUser?.role ?? null;
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.getRole();
    return role ? allowedRoles.includes(role) : false;
  }

  /**
   * Get available mock users for testing/display purposes
   */
  getMockUsers() {
    return USERS_MOCK.map(u => ({
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      position: u.position
    }));
  }
}
