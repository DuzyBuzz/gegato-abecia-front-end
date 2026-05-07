export enum RoleAccess {
  Biller = 1,
  Accounting = 2,
  Admin = 3,
}

export const ROLE_ACCESS_LABELS: Record<RoleAccess, string> = {
  [RoleAccess.Biller]: 'Biller',
  [RoleAccess.Accounting]: 'Accounting',
  [RoleAccess.Admin]: 'Admin',
};

export const ROLE_ACCESS_COMPANY_ROLES: Record<RoleAccess, string> = {
  [RoleAccess.Biller]: 'BILLER',
  [RoleAccess.Accounting]: 'ACCOUNTING',
  [RoleAccess.Admin]: 'SUPER_USER',
};

export function normalizeRoleAccess(value: unknown): RoleAccess | undefined {
  const numericValue = Number(value);

  if (numericValue === RoleAccess.Biller || numericValue === RoleAccess.Accounting || numericValue === RoleAccess.Admin) {
    return numericValue;
  }

  return undefined;
}

export function normalizeCompanyRole(value: string | null | undefined): string {
  const normalizedRole = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

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

export function resolveRoleAccess(value: unknown, fallbackRole?: string | null): RoleAccess | undefined {
  const normalizedRoleAccess = normalizeRoleAccess(value);

  if (normalizedRoleAccess) {
    return normalizedRoleAccess;
  }

  switch (normalizeCompanyRole(fallbackRole)) {
    case 'BILLER':
      return RoleAccess.Biller;
    case 'ACCOUNTING':
      return RoleAccess.Accounting;
    case 'SUPER_USER':
      return RoleAccess.Admin;
    default:
      return undefined;
  }
}

export function getRoleLabel(roleAccess: unknown, fallbackRole?: string | null): string {
  const normalizedRoleAccess = resolveRoleAccess(roleAccess, fallbackRole);

  if (normalizedRoleAccess) {
    return ROLE_ACCESS_LABELS[normalizedRoleAccess];
  }

  return 'User';
}

export function getCompanyRole(roleAccess: unknown, fallbackRole?: string | null): string {
  const normalizedRoleAccess = resolveRoleAccess(roleAccess, fallbackRole);

  if (normalizedRoleAccess) {
    return ROLE_ACCESS_COMPANY_ROLES[normalizedRoleAccess];
  }

  return normalizeCompanyRole(fallbackRole);
}

export function isAllowedRoleAccess(currentRoleAccess: unknown, allowedRoleAccess: number[]): boolean {
  const normalizedCurrentRoleAccess = normalizeRoleAccess(currentRoleAccess);

  if (!normalizedCurrentRoleAccess) {
    return false;
  }

  return allowedRoleAccess.some((allowedRoleAccessValue) => normalizeRoleAccess(allowedRoleAccessValue) === normalizedCurrentRoleAccess);
}