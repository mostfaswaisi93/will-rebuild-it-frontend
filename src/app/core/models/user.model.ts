import { AccountStatus, UserRole } from './domain.constants';
import { Address } from './shared.model';

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  createdAt: string;
  /** Set only for `role: 'team'` — the reconstruction team this user works for. */
  teamId?: string;
  /** Absent means `active` — only back-office accounts are ever suspended. */
  status?: AccountStatus;
  /**
   * False for a contractor who signed up but never finished onboarding. Absent
   * means complete; only contractor accounts go through that second stage.
   */
  registrationComplete?: boolean;
  /** Set only for `role: 'contractor' | 'staff' | 'supplier'`. */
  organisationId?: string;
}

export interface BeneficiaryProfile extends User {
  role: 'beneficiary';
  familySize: number;
  propertyAddress: Address;
  identityDocumentUrl?: string;
}

export interface AuthSession {
  token: string;
  user: User;
}
