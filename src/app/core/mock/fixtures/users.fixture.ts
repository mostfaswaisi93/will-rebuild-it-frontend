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

  // --- Back-office accounts (this portal) --------------------------------
  {
    id: 'user-admin-1',
    role: 'admin',
    firstName: 'Layla',
    lastName: 'Abu Shammala',
    email: 'admin@example.com',
    phone: '+970597001122',
    createdAt: '2025-11-02T08:00:00.000Z',
    status: 'active',
  },
  {
    id: 'user-contractor-1',
    role: 'contractor',
    firstName: 'Bassam',
    lastName: 'Al-Masri',
    email: 'contractor@example.com',
    phone: '+970598334455',
    createdAt: '2025-11-20T08:00:00.000Z',
    status: 'active',
    registrationComplete: true,
    organisationId: 'org-contractor-1',
  },
  /**
   * Shares `contractor@example.com` with the account above — one person who both
   * runs a contracting firm and had their own home damaged. This is the case the
   * sign-in role picker exists for.
   */
  {
    id: 'user-beneficiary-2',
    role: 'beneficiary',
    firstName: 'Bassam',
    lastName: 'Al-Masri',
    email: 'contractor@example.com',
    phone: '+970598334455',
    createdAt: '2026-01-05T08:00:00.000Z',
    status: 'active',
  },
  {
    id: 'user-staff-1',
    role: 'staff',
    firstName: 'Rami',
    lastName: 'Qudaih',
    email: 'staff@example.com',
    phone: '+970599556677',
    createdAt: '2026-01-18T08:00:00.000Z',
    status: 'active',
    organisationId: 'org-contractor-1',
  },
  {
    id: 'user-supplier-1',
    role: 'supplier',
    firstName: 'Nadia',
    lastName: 'Shurrab',
    email: 'supplier@example.com',
    phone: '+970591778899',
    createdAt: '2026-02-11T08:00:00.000Z',
    status: 'active',
    organisationId: 'org-supplier-1',
  },
  /** Exercises the "registration incomplete" sign-in block. */
  {
    id: 'user-contractor-2',
    role: 'contractor',
    firstName: 'Hani',
    lastName: 'Barghouth',
    email: 'pending@example.com',
    phone: '+970594112233',
    createdAt: '2026-06-30T08:00:00.000Z',
    status: 'inactive',
    registrationComplete: false,
  },
  /** Exercises the "account suspended" sign-in block. */
  {
    id: 'user-contractor-3',
    role: 'contractor',
    firstName: 'Suhail',
    lastName: 'Dahlan',
    email: 'suspended@example.com',
    phone: '+970593445566',
    createdAt: '2026-03-14T08:00:00.000Z',
    status: 'suspended',
    registrationComplete: true,
  },
];

/**
 * Demo credentials — no real backend exists yet; this seeds the mock sign-in
 * flow. Keyed by email, so the two accounts sharing `contractor@example.com`
 * share one password, which is what a real identity provider would do.
 */
export const seedCredentials: Record<string, { password: string; userId: string }> = {
  'youssef@example.com': { password: 'Demo@1234', userId: 'user-beneficiary-1' },
  'amina@example.com': { password: 'Demo@1234', userId: 'user-donor-1' },
  'team@example.com': { password: 'Demo@1234', userId: 'user-team-1' },
  'admin@example.com': { password: 'Demo@1234', userId: 'user-admin-1' },
  'contractor@example.com': { password: 'Demo@1234', userId: 'user-contractor-1' },
  'staff@example.com': { password: 'Demo@1234', userId: 'user-staff-1' },
  'supplier@example.com': { password: 'Demo@1234', userId: 'user-supplier-1' },
  'pending@example.com': { password: 'Demo@1234', userId: 'user-contractor-2' },
  'suspended@example.com': { password: 'Demo@1234', userId: 'user-contractor-3' },
};
