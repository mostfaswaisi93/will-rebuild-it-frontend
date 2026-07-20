import { EstimateStatus } from './domain.constants';

export type BoqCategory = 'materials' | 'labor' | 'equipment' | 'custom';

export interface BoqItem {
  id: string;
  category: BoqCategory;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  projectId: string;
  projectTitle: string;
  teamId: string;
  teamName: string;
  status: EstimateStatus;
  items: BoqItem[];
  subtotal: number;
  discounts: number;
  tax: number;
  total: number;
  fundingRequired: number;
  fundedAmount: number;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}
