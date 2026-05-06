export interface User {
  id?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  username: string;
  accountNumber?: string;
  password?: string;
  position?: string;
  role: string;
  companyRole?: string;
  roleAccess?: number;
}
