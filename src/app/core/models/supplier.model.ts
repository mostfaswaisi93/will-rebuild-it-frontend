import { MaterialCategory } from './domain.constants';
import { Address } from './shared.model';

export const SUPPLIER_STATUSES = ['pending', 'approved', 'suspended'] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

/**
 * A materials supplier (legacy `vendor`) — a firm the platform buys
 * reconstruction materials from. The catalogue of what they sell is expressed
 * as `MaterialCategory` tags rather than a full product list; purchase orders
 * reference the supplier, not individual SKUs, at this stage.
 */
export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  address: Address;
  categories: MaterialCategory[];
  status: SupplierStatus;
  /** Registration / commercial number, for procurement records. */
  registrationNumber?: string;
  createdAt: string;
}
