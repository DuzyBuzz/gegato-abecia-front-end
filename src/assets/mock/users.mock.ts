import { User } from '../../app/shared/features/users/users.model';

export const USERS_MOCK: User[] = [
  {
    userId: 1,
    firstName: 'John',
    lastName: 'Administrator',
    username: '1',
    password: '1', // In production, passwords should never be in mock data
    position: 'System Administrator',
    role: 'Admin',
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    userId: 2,
    firstName: 'Maria',
    lastName: 'Garcia',
    username: '2',
    password: '2',
    position: 'Billing Officer',
    role: 'Biller',
    createdAt: '2026-01-05T09:00:00Z'
  },
  {
    userId: 3,
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    username: 'test_user',
    password: 'password',
    position: 'Operations Manager',
    role: 'Biller',
    createdAt: '2026-01-10T10:30:00Z'
  },
  {
    userId: 4,
    firstName: 'Elena',
    lastName: 'Fernandez',
    username: 'elena.fernandez',
    password: 'password123',
    position: 'Data Entry Personnel',
    role: 'Staff',
    createdAt: '2026-01-15T08:15:00Z'
  },
  {
    userId: 5,
    firstName: 'Anthony',
    lastName: 'Reyes',
    username: 'anthony.reyes',
    password: 'password123',
    position: 'Finance Officer',
    role: 'Admin',
    createdAt: '2026-01-20T14:00:00Z'
  },
  {
    userId: 6,
    firstName: 'Sandra',
    lastName: 'Cruz',
    username: 'sandra.cruz',
    password: 'password123',
    position: 'Records Clerk',
    role: 'Staff',
    createdAt: '2026-01-25T11:45:00Z'
  },
  {
    userId: 7,
    firstName: 'Daniel',
    lastName: 'Santos',
    username: 'daniel.santos',
    password: 'password123',
    position: 'Report Viewer',
    role: 'Viewer',
    createdAt: '2026-02-01T09:30:00Z'
  },
  {
    userId: 8,
    firstName: 'Patricia',
    lastName: 'Morales',
    username: 'patricia.morales',
    password: 'password123',
    position: 'Accounts Clerk',
    role: 'Staff',
    createdAt: '2026-02-03T13:20:00Z'
  },
  {
    userId: 9,
    firstName: 'Michael',
    lastName: 'Tan',
    username: 'michael.tan',
    password: 'password123',
    position: 'System Officer',
    role: 'Admin',
    createdAt: '2026-02-05T10:00:00Z'
  },
  {
    userId: 10,
    firstName: 'Jennifer',
    lastName: 'Villanueva',
    username: 'jennifer.villanueva',
    password: 'password123',
    position: 'Audit Trail Viewer',
    role: 'Viewer',
    createdAt: '2026-02-07T15:30:00Z'
  }
];

// Test user credentials for login
export const LOGIN_TEST_CREDENTIALS = [
  { username: '1', password: '1', role: 'Admin' },
  { username: '2', password: '2', role: 'Biller' },
  { username: 'anthony.reyes', password: 'password123', role: 'Admin' },
  { username: 'michael.tan', password: 'password123', role: 'Admin' }
];
