import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from './users.model';

@Injectable({ providedIn: 'root' })
export class UserService {

  private static readonly ROLE_ACCESS_TO_LABEL: Record<number, string> = {
    1: 'Biller',
    2: 'Accounting',
    3: 'Admin',
  };

  private static readonly ROLE_ACCESS_TO_COMPANY_ROLE: Record<number, string> = {
    1: 'BILLER',
    2: 'ACCOUNTING',
    3: 'SUPER_USER',
  };

  private api = `${environment.api}/ua_control`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.api}/find`).pipe(
      map((response) => this.mapUserArray(response))
    );
  }

  getUser(identifier: number | string): Observable<User> {
    return this.http.get<any>(`${this.api}/find_record/${encodeURIComponent(String(identifier))}`).pipe(
      map((response) => {
        const users = this.mapUserArray(response);

        if (users.length === 0) {
          throw new Error('User not found');
        }

        return users[0];
      })
    );
  }

  save(user: User): Observable<User> {
    const payload = this.mapUserToApi(user);

    return this.http.post<any>(`${this.api}/save`, payload).pipe(
      map((response) => {
        const savedUsers = this.mapUserArray(response);
        if (savedUsers.length > 0) {
          return {
            ...savedUsers[0],
            password: user.password || savedUsers[0].password,
          };
        }

        return {
          ...user,
          role: this.mapRoleLabel(user.roleAccess, user.companyRole || user.role),
          companyRole: this.normalizeCompanyRole(user.companyRole || user.role),
          roleAccess: this.resolveRoleAccess(user.roleAccess, user.companyRole || user.role),
        };
      })
    );
  }

  private mapUserArray(response: any): User[] {
    const records = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : response
          ? [response]
          : [];

    return records
      .filter((record: any) => !!record)
      .map((record: any) => this.mapUserRecord(record));
  }

  private mapUserRecord(record: any): User {
    const resolvedId = this.toNumber(record?.id ?? record?.userId) ?? undefined;
    const roleAccess = this.toNumber(record?.roleAccess) ?? undefined;
    const accountNumber = this.cleanString(record?.accountNumber)
      || this.cleanString(record?.username)
      || this.cleanString(record?.userName)
      || '';
    const companyRole = this.normalizeCompanyRoleByRoleAccess(
      roleAccess,
      this.cleanString(record?.companyRole)
      || this.cleanString(record?.roleText)
      || (typeof record?.role === 'string' ? record.role : undefined)
    );

    return {
      id: resolvedId,
      userId: resolvedId,
      username: accountNumber,
      accountNumber,
      firstName: this.cleanString(record?.firstName) || '',
      lastName: this.cleanString(record?.lastName) || '',
      role: this.mapRoleLabel(roleAccess, companyRole),
      companyRole,
      password: this.cleanString(record?.password) || undefined,
      position: this.cleanString(record?.position) || undefined,
      roleAccess,
    };
  }

  private mapUserToApi(user: User): any {
    const accountNumber = this.cleanString(user.accountNumber || user.username) || '';
    const password = this.cleanString(user.password);
    const companyRole = this.normalizeCompanyRole(user.companyRole || user.role);
    const roleAccess = this.resolveRoleAccess(user.roleAccess, companyRole);
    const payload: any = {
      id: this.toNumber(user.id ?? user.userId) ?? undefined,
      accountNumber,
      username: accountNumber,
      userName: accountNumber,
      firstName: this.cleanString(user.firstName) || '',
      lastName: this.cleanString(user.lastName) || '',
      companyRole,
      position: this.cleanString(user.position) || undefined,
      roleAccess,
    };

    if (password) {
      payload.password = password;
    }

    return payload;
  }

  private mapRoleLabel(roleAccess: number | undefined, role: string | undefined): string {
    if (typeof roleAccess === 'number' && UserService.ROLE_ACCESS_TO_LABEL[roleAccess]) {
      return UserService.ROLE_ACCESS_TO_LABEL[roleAccess];
    }

    switch (role) {
      case 'SUPER_USER':
        return 'Admin';
      case 'ACCOUNTING':
        return 'Accounting';
      case 'BILLER':
        return 'Biller';
      default:
        return 'User';
    }
  }

  private normalizeCompanyRole(role: string | undefined): string {
    const normalizedRole = String(role ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

    switch (normalizedRole) {
      case 'ADMIN':
      case 'ADMINISTRATOR':
      case 'SUPERUSER':
      case 'SUPER_USER':
        return 'SUPER_USER';
      case 'ACCOUNTING':
      case 'ACCOUNTANT':
        return 'ACCOUNTING';
      case 'BILLER':
      case 'STAFF':
      case 'COLLECTOR':
        return 'BILLER';
      case 'USER':
        return 'USER';
      default:
        return normalizedRole || 'USER';
    }
  }

  private normalizeCompanyRoleByRoleAccess(roleAccess: number | undefined, role: string | undefined): string {
    if (typeof roleAccess === 'number' && UserService.ROLE_ACCESS_TO_COMPANY_ROLE[roleAccess]) {
      return UserService.ROLE_ACCESS_TO_COMPANY_ROLE[roleAccess];
    }

    return this.normalizeCompanyRole(role);
  }

  private resolveRoleAccess(roleAccess: number | undefined, role: string | undefined): number | undefined {
    if (typeof roleAccess === 'number' && UserService.ROLE_ACCESS_TO_LABEL[roleAccess]) {
      return roleAccess;
    }

    switch (this.normalizeCompanyRole(role)) {
      case 'BILLER':
        return 1;
      case 'ACCOUNTING':
        return 2;
      case 'SUPER_USER':
        return 3;
      default:
        return undefined;
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
}
