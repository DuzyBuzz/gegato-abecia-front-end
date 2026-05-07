import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { RoleAccess, getRoleLabel, isAllowedRoleAccess, resolveRoleAccess } from '../utils/role-access.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = `${environment.api}/ua_control`;

  constructor(private http: HttpClient) {}

  getHomeRoute(roleAccess: number | null = this.getRoleAccess()): string {
    switch (resolveRoleAccess(roleAccess)) {
      case RoleAccess.Admin:
        return '/admin/dashboard';
      case RoleAccess.Accounting:
        return '/accounting/deceased';
      case RoleAccess.Biller:
        return '/billing/deceased';
      default:
        return '/login';
    }
  }

  canManageFuneralContracts(): boolean {
    return this.hasRoleAccess([RoleAccess.Admin, RoleAccess.Biller]);
  }

  canCreateFuneralContracts(): boolean {
    return this.hasRoleAccess([RoleAccess.Admin, RoleAccess.Biller]);
  }

  canAccessPayments(): boolean {
    return this.hasRoleAccess([RoleAccess.Admin, RoleAccess.Biller, RoleAccess.Accounting]);
  }

  canManagePayments(): boolean {
    return this.hasRoleAccess([RoleAccess.Admin, RoleAccess.Accounting]);
  }

  canManageCharges(): boolean {
    return this.hasRoleAccess([RoleAccess.Admin, RoleAccess.Biller]);
  }

  isBiller(): boolean {
    return this.hasRoleAccess([RoleAccess.Biller]);
  }

  isAccounting(): boolean {
    return this.hasRoleAccess([RoleAccess.Accounting]);
  }

  isAdmin(): boolean {
    return this.hasRoleAccess([RoleAccess.Admin]);
  }

  getOperationsBaseRoute(): string {
    switch (this.getRoleAccess()) {
      case RoleAccess.Admin:
        return '/admin';
      case RoleAccess.Accounting:
        return '/accounting';
      case RoleAccess.Biller:
      default:
        return '/billing';
    }
  }

  getProfileRoute(): string {
    return `${this.getOperationsBaseRoute()}/profile`;
  }

  getContractBillingRoute(contractId: number | string): string {
    return `${this.getOperationsBaseRoute()}/forms/contracts/billing/${contractId}`;
  }

  getContractPaymentsRoute(contractId: number | string): string {
    return `${this.getOperationsBaseRoute()}/forms/contracts/payments/${contractId}`;
  }

  getContractFinanceRoute(contractId: number | string): string {
    return this.isBiller()
      ? this.getContractBillingRoute(contractId)
      : this.getContractPaymentsRoute(contractId);
  }

  getContractFinanceLabel(): string {
    return this.isBiller() ? 'Billing' : 'Payments';
  }

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
    const companyRole = this.cleanString(userRecord?.companyRole)
      || this.cleanString(userRecord?.role)
      || undefined;
    const roleAccess = resolveRoleAccess(this.toNumber(userRecord?.roleAccess), companyRole);
    const accountNumber = this.cleanString(userRecord?.accountNumber)
      || this.cleanString(userRecord?.username)
      || this.cleanString(userRecord?.userName)
      || fallbackUsername;

    return {
      id: resolvedId,
      userId: resolvedId,
      username: accountNumber,
      accountNumber,
      firstName: this.cleanString(userRecord?.firstName) || '',
      lastName: this.cleanString(userRecord?.lastName) || '',
      password: this.cleanString(userRecord?.password) || undefined,
      roleAccess,
    };
  }

  private matchesUsername(record: any, username: string): boolean {
    const normalizedUsername = username.trim().toLowerCase();
    const candidates = [record?.accountNumber, record?.username, record?.userName]
      .map((value) => this.cleanString(value)?.toLowerCase())
      .filter((value): value is string => !!value);

    return candidates.includes(normalizedUsername);
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
      return this.normalizeStoredUser(JSON.parse(user) as User);
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
    const user = this.currentUser;

    if (!user) {
      return null;
    }

    return getRoleLabel(user.roleAccess);
  }

  getRoleAccess(): RoleAccess | null {
    const user = this.currentUser;

    if (!user) {
      return null;
    }

    const legacyRole = (user as any).companyRole || (user as any).role;
    return resolveRoleAccess(user.roleAccess, legacyRole) ?? null;
  }

  hasRoleAccess(allowedRoleAccess: number[]): boolean {
    return isAllowedRoleAccess(this.getRoleAccess(), allowedRoleAccess);
  }

  hasRole(allowedRoles: Array<string | number>): boolean {
    const allowedRoleAccess = allowedRoles
      .map((allowedRole) => resolveRoleAccess(allowedRole, String(allowedRole)))
      .filter((allowedRole): allowedRole is RoleAccess => allowedRole !== undefined);

    return this.hasRoleAccess(allowedRoleAccess);
  }

  private normalizeStoredUser(user: User): User {
    const legacyRole = (user as any).companyRole || (user as any).role;
    const roleAccess = resolveRoleAccess(user.roleAccess, legacyRole);

    return {
      ...user,
      roleAccess,
    };
  }
}
