export interface User {
  id: number;
  userId?: number;
  username: string;
  accountNumber?: string;
  firstName: string;
  lastName: string;
  role: string;
  companyRole?: string;
  password?: string;
  position?: string;
}