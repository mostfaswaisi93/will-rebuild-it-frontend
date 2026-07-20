import { BeneficiaryProfile } from '@core/models';

export interface NotificationPreferences {
  projectUpdates: boolean;
  fundingUpdates: boolean;
  teamMessages: boolean;
  donationReceipts: boolean;
}

export const seedBeneficiaryProfile: BeneficiaryProfile = {
  id: 'user-beneficiary-1',
  role: 'beneficiary',
  firstName: 'Youssef',
  lastName: 'Al-Najjar',
  email: 'youssef@example.com',
  phone: '+970591234567',
  createdAt: '2026-01-12T08:00:00.000Z',
  familySize: 6,
  propertyAddress: {
    governorate: 'northGaza',
    district: 'Beit Lahia',
    streetDescription: 'Near the old water tower',
  },
};

export const seedNotificationPreferences: NotificationPreferences = {
  projectUpdates: true,
  fundingUpdates: true,
  teamMessages: true,
  donationReceipts: false,
};
