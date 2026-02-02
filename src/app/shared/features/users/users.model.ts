// users.model.ts
export interface User {
  userId: number;      // optional for CREATE
  firstName: string;
  lastName: string;
  username: string;     // maps to userName in backend
  password?: string;
  position?: string;
  role: string;
  createdAt?: string | Date;
}
