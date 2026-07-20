import { User } from '@core/models';

export const seedUsers: User[] = [
  {
    id: 'user-beneficiary-1',
    role: 'beneficiary',
    firstName: 'Youssef',
    lastName: 'Al-Najjar',
    email: 'youssef@example.com',
    phone: '+970591234567',
    createdAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'user-donor-1',
    role: 'donor',
    firstName: 'Amina',
    lastName: 'Haddad',
    email: 'amina@example.com',
    phone: '+970599876543',
    createdAt: '2026-02-03T08:00:00.000Z',
  },
  {
    id: 'user-team-1',
    role: 'team',
    firstName: 'Omar',
    lastName: 'Zaanin',
    email: 'team@example.com',
    phone: '+970592223344',
    createdAt: '2025-12-01T08:00:00.000Z',
    teamId: 'team-1',
  },
];

/** Demo credentials — no real backend exists yet; this seeds the mock sign-in flow. */
export const seedCredentials: Record<string, { password: string; userId: string }> = {
  'youssef@example.com': { password: 'Demo@1234', userId: 'user-beneficiary-1' },
  'amina@example.com': { password: 'Demo@1234', userId: 'user-donor-1' },
  'team@example.com': { password: 'Demo@1234', userId: 'user-team-1' },
};
