export type UserRole = 'biller' | 'accounting' | 'admin' | 'owner';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string;
}
