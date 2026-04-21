import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api = `${environment.api}/ua_control`;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<User> {
    const normalizedUsername = username.trim();

    return this.http.get<any>(`${this.api}/find_record/${encodeURIComponent(normalizedUsername)}`).pipe(
      timeout(10000),
      map((response) => this.extractUserRecord(response, normalizedUsername)),
      map((userRecord) => this.validatePassword(userRecord, password)),
      map((userRecord) => this.mapAuthUser(userRecord, normalizedUsername)),
      tap((mappedUser) => localStorage.setItem('user', JSON.stringify(mappedUser))),
      catchError((error) => {
        if (error?.status === 404) {
          return throwError(() => new Error('User not found'));
        }

        return throwError(() => error);
      })
    );
  }

  private extractUserRecord(response: any, username: string): any {
    console.log('[AuthService] API RESPONSE:', response);

    const records = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : response
          ? [response]
          : [];

    const matchedRecord = records.find((record: any) => this.matchesUsername(record, username));
    const userRecord = matchedRecord ?? records[0];

    if (!userRecord) {
      throw new Error('User not found');
    }

    return userRecord;
  }

  private validatePassword(userRecord: any, password: string): any {
    const storedPassword = String(userRecord?.password ?? '').trim();
    const inputPassword = String(password ?? '').trim();

    if (storedPassword !== inputPassword) {
      throw new Error('Invalid password');
    }

    return userRecord;
  }

  private mapAuthUser(userRecord: any, fallbackUsername: string): User {
    const resolvedId = this.toNumber(userRecord?.id ?? userRecord?.userId) ?? 0;
    const accountNumber = this.cleanString(userRecord?.accountNumber)
      || this.cleanString(userRecord?.username)
      || this.cleanString(userRecord?.userName)
      || fallbackUsername;
    const companyRole = this.cleanString(userRecord?.companyRole)
      || this.cleanString(userRecord?.role)
      || undefined;

    return {
      id: resolvedId,
      userId: resolvedId,
      username: accountNumber,
      accountNumber,
      firstName: this.cleanString(userRecord?.firstName) || '',
      lastName: this.cleanString(userRecord?.lastName) || '',
      role: this.mapRole(companyRole),
      companyRole,
      password: this.cleanString(userRecord?.password) || undefined,
      position: this.cleanString(userRecord?.position) || undefined,
    };
  }

  private matchesUsername(record: any, username: string): boolean {
    const normalizedUsername = username.trim().toLowerCase();
    const candidates = [record?.accountNumber, record?.username, record?.userName]
      .map((value) => this.cleanString(value)?.toLowerCase())
      .filter((value): value is string => !!value);

    return candidates.includes(normalizedUsername);
  }

  private mapRole(role: string | undefined): string {
    const normalizedRole = (role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

    switch (normalizedRole) {
      case 'ADMIN':
      case 'ADMINISTRATOR':
        return 'Admin';
      case 'SUPER_USER':
      case 'SUPERUSER':
      case 'BILLER':
      case 'STAFF':
      case 'COLLECTOR':
        return 'Biller';
      case 'USER':
        return 'User';
      default:
        if (!role) {
          return 'User';
        }

        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }
  }

  private cleanString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmedValue = String(value).trim();
    return trimmedValue ? trimmedValue : null;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  logout() {
    localStorage.removeItem('user');
  }

  get currentUser(): User | null {
    const user = localStorage.getItem('user');
    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as User;
    } catch (error) {
      console.error('[AuthService] Failed to parse stored user:', error);
      this.logout();
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  getRole(): string | null {
    return this.currentUser?.role ?? null;
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.getRole();
    return role
      ? allowedRoles.some((allowedRole) => allowedRole.toLowerCase() === role.toLowerCase())
      : false;
  }
}
