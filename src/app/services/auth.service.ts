import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api = 'http://localhost:8080/api/auth/';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {

    console.log('[AuthService] login() called');
    console.log('[AuthService] username:', username);
    console.log('[AuthService] sending request to:', `${this.api}/login`);

    return this.http.post<any>(`${this.api}/login`, {
      userName: username, 
      password
    }).pipe(
      tap({
        next: (user) => {
          console.log('[AuthService] login SUCCESS');
          console.log('[AuthService] response:', user);

          localStorage.setItem('user', JSON.stringify(user));

          console.log('[AuthService] user saved to localStorage');
          console.log('[AuthService] localStorage user:', localStorage.getItem('user'));
        },
        error: (err) => {
          console.error('[AuthService] login FAILED');
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

}
