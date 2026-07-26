import { Address, Attachment } from './shared.model';

export interface BusinessHours {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

export interface TeamService {
  id: string;
  title: string;
  description: string;
}

/**
 * Whether a contracting firm may currently be worked with. The legacy portal
 * carried this as an `Active`/`Suspended` modal on the pro's private profile.
 *
 * It is the enforcement end of membership: the annual fee exists to keep a firm
 * verified and eligible for tenders, so there has to be a way to withdraw that
 * standing when a licence lapses or an inspection fails. Suppliers,
 * beneficiaries and staff each already had one.
 */
export const TEAM_STATUSES = ['active', 'suspended'] as const;
export type TeamStatus = (typeof TEAM_STATUSES)[number];

export interface Team {
  id: string;
  name: string;
  status: TeamStatus;
  /** Why the current status was set. Required to suspend — never a bare flag. */
  statusNote?: string;
  statusChangedAt?: string;
  logoUrl?: string;
  specializations: string[];
  licenseNumbers: string[];
  isLicensed: boolean;
  isInsured: boolean;
  acceptsLargeProjects: boolean;
  workingSince: string;
  bio: string;
  coverageAreas: Address[];
  businessHours: BusinessHours[];
  completedProjectsCount: number;
  averageRating: number;
  reviewsCount: number;
  services: TeamService[];
  portfolio: Attachment[];
  phone: string;
  email: string;
  isFollowedByCurrentUser?: boolean;
}

export interface TeamReview {
  id: string;
  teamId: string;
  projectId: string;
  authorName: string;
  workQuality: number;
  timeliness: number;
  professionalism: number;
  comments: string;
  createdAt: string;
}
