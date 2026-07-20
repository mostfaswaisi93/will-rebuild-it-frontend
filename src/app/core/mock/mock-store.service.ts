import { Injectable } from '@angular/core';
import {
  AppNotification,
  BeneficiaryProfile,
  Complaint,
  Donation,
  Estimate,
  Funding,
  GeoArea,
  GlobalSettings,
  Project,
  ReconstructionRequest,
  SupportTicket,
  Team,
  TeamReview,
  User,
} from '@core/models';
import { seedCredentials, seedUsers } from './fixtures/users.fixture';
import { seedGeoAreas, seedGlobalSettings } from './fixtures/master.fixture';
import { seedTeamReviews, seedTeams } from './fixtures/teams.fixture';
import { seedRequests } from './fixtures/requests.fixture';
import { seedProjects } from './fixtures/projects.fixture';
import { seedEstimates } from './fixtures/estimates.fixture';
import { seedFunding } from './fixtures/funding.fixture';
import { seedDonations } from './fixtures/donations.fixture';
import { seedSupportTickets } from './fixtures/support.fixture';
import { seedComplaints } from './fixtures/complaints.fixture';
import { seedNotifications } from './fixtures/notifications.fixture';
import { seedAssessmentQuestions } from './fixtures/assessment.fixture';
import {
  NotificationPreferences,
  seedBeneficiaryProfile,
  seedNotificationPreferences,
} from './fixtures/profile.fixture';

/**
 * In-memory mock backend store. One instance per app injector — a fresh
 * instance per SSR request server-side, and one instance for the whole
 * client session in the browser. Seeded by structuredClone so fixtures
 * stay pristine across instances.
 */
@Injectable({ providedIn: 'root' })
export class MockStore {
  readonly users: User[] = structuredClone(seedUsers);
  readonly credentials: Record<string, { password: string; userId: string }> = structuredClone(seedCredentials);
  readonly geoAreas: GeoArea[] = structuredClone(seedGeoAreas);
  readonly globalSettings: GlobalSettings = structuredClone(seedGlobalSettings);
  readonly teams: Team[] = structuredClone(seedTeams);
  readonly teamReviews: TeamReview[] = structuredClone(seedTeamReviews);
  readonly requests: ReconstructionRequest[] = structuredClone(seedRequests);
  readonly projects: Project[] = structuredClone(seedProjects);
  readonly estimates: Estimate[] = structuredClone(seedEstimates);
  readonly funding: Funding[] = structuredClone(seedFunding);
  readonly donations: Donation[] = structuredClone(seedDonations);
  readonly supportTickets: SupportTicket[] = structuredClone(seedSupportTickets);
  readonly complaints: Complaint[] = structuredClone(seedComplaints);
  readonly notifications: AppNotification[] = structuredClone(seedNotifications);
  /** Stored bilingual; the master handler resolves them to the caller's locale. */
  readonly assessmentQuestions: typeof seedAssessmentQuestions = structuredClone(seedAssessmentQuestions);
  beneficiaryProfile: BeneficiaryProfile = structuredClone(seedBeneficiaryProfile);
  notificationPreferences: NotificationPreferences = structuredClone(seedNotificationPreferences);

  /** The "currently signed-in" demo beneficiary's requests/projects are the ones seeded above. */
  readonly currentBeneficiaryId = 'user-beneficiary-1';
}
