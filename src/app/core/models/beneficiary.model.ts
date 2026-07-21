import { Address } from './shared.model';

export const BENEFICIARY_STATUSES = ['pending', 'verified', 'rejected'] as const;
export type BeneficiaryStatus = (typeof BENEFICIARY_STATUSES)[number];

/**
 * A household case file in the back office — the reconstruction analogue of the
 * legacy `customer`. Distinct from the customer app's auth-focused
 * `BeneficiaryProfile`: this is the operator's record, carrying the
 * eligibility verification status and the vulnerability flags used to
 * prioritise reconstruction, not a login.
 */
export interface Beneficiary {
  id: string;
  name: string;
  /** Palestinian national ID — the household's case key. */
  nationalId: string;
  phone: string;
  email?: string;
  address: Address;
  familySize: number;
  /** Prioritisation flags — a female-headed, displaced household with a
   * disabled member is triaged ahead of a partially-damaged second home. */
  femaleHeaded: boolean;
  hasDisability: boolean;
  elderlyPresent: boolean;
  displaced: boolean;
  status: BeneficiaryStatus;
  registeredAt: string;
}
