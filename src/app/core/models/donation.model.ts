import { DonationFrequency, DonationStatus } from './domain.constants';

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  frequency: DonationFrequency;
  status: DonationStatus;
  projectId?: string;
  projectTitle?: string;
  donorName: string;
  isAnonymous: boolean;
  receiptUrl?: string;
  createdAt: string;
}
