import { FundingStatus } from './domain.constants';

export interface Disbursement {
  id: string;
  fundingId: string;
  amount: number;
  funderName: string;
  disbursedAt: string;
  receiptUrl?: string;
  isVoided: boolean;
  isRefunded: boolean;
}

export interface Funding {
  id: string;
  fundingNumber: string;
  projectId: string;
  projectTitle: string;
  phaseKey: string;
  status: FundingStatus;
  fundedAmount: number;
  outstandingAmount: number;
  refundedAmount: number;
  disbursements: Disbursement[];
  receiptConfirmedAt?: string;
  createdAt: string;
}
