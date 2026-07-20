import { UserRole } from './domain.constants';
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
