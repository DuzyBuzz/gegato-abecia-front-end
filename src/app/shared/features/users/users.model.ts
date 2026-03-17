// users.model.ts
export interface User {
  userId: number;      
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  position?: string;
  role: string;
  createdAt?: string | Date;
}
