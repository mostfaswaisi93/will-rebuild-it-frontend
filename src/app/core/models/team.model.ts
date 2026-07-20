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

export interface Team {
  id: string;
  name: string;
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
