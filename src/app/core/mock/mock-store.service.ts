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
  UserRole,
  Beneficiary,
  PricebookItem,
  PurchaseOrder,
  StockItem,
  Supplier,
  Equipment,
  Payout,
  Campaign,
  DeliveryLog,
  MonitoringReport,
  PriceListItem,
  Shipment,
  StaffMember,
  Subscription,
  TermsDocument,
  Warehouse,
  Statement,
  WorkOrder,
} from '@core/models';
import { seedCredentials, seedUsers } from './fixtures/users.fixture';
import { seedGeoAreas, seedGlobalSettings } from './fixtures/master.fixture';
import { seedTeamReviews, seedTeams } from './fixtures/teams.fixture';
import { seedRequests } from './fixtures/requests.fixture';
import { seedProjects } from './fixtures/projects.fixture';
import { seedWorkOrders } from './fixtures/work-orders.fixture';
import { seedStatements } from './fixtures/statements.fixture';
import { seedPricebook } from './fixtures/pricebook.fixture';
import { seedBeneficiaries } from './fixtures/beneficiaries.fixture';
import { seedSuppliers } from './fixtures/suppliers.fixture';
import { seedWarehouses, seedStock, seedPurchaseOrders } from './fixtures/inventory.fixture';
import { seedEquipment } from './fixtures/equipment.fixture';
import { seedPayouts } from './fixtures/payouts.fixture';
import { seedTerms } from './fixtures/terms.fixture';
import { seedStaff } from './fixtures/staff.fixture';
import { seedCampaigns } from './fixtures/campaigns.fixture';
import { seedDeliveryLogs } from './fixtures/delivery-logs.fixture';
import { seedMonitoringReports } from './fixtures/monitoring.fixture';
import { seedMembershipPlans, seedSubscriptions } from './fixtures/subscriptions.fixture';
import { seedShipments } from './fixtures/shipments.fixture';
import { seedPriceList } from './fixtures/price-list.fixture';
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
  readonly workOrders: WorkOrder[] = structuredClone(seedWorkOrders);
  readonly statements: Statement[] = structuredClone(seedStatements);
  readonly pricebook: PricebookItem[] = structuredClone(seedPricebook);
  readonly beneficiaries: Beneficiary[] = structuredClone(seedBeneficiaries);
  readonly suppliers: Supplier[] = structuredClone(seedSuppliers);
  readonly warehouses: Warehouse[] = structuredClone(seedWarehouses);
  readonly stock: StockItem[] = structuredClone(seedStock);
  readonly purchaseOrders: PurchaseOrder[] = structuredClone(seedPurchaseOrders);
  readonly equipment: Equipment[] = structuredClone(seedEquipment);
  readonly payouts: Payout[] = structuredClone(seedPayouts);
  readonly terms: TermsDocument[] = structuredClone(seedTerms);
  readonly staff: StaffMember[] = structuredClone(seedStaff);
  readonly campaigns: Campaign[] = structuredClone(seedCampaigns);
  readonly deliveryLogs: DeliveryLog[] = structuredClone(seedDeliveryLogs);
  readonly monitoringReports: MonitoringReport[] = structuredClone(seedMonitoringReports);
  readonly subscriptions: Subscription[] = structuredClone(seedSubscriptions);
  /** Bilingual, like `assessmentQuestions`: the handler localizes per request. */
  readonly membershipPlans: typeof seedMembershipPlans = structuredClone(seedMembershipPlans);
  readonly shipments: Shipment[] = structuredClone(seedShipments);
  readonly priceList: PriceListItem[] = structuredClone(seedPriceList);
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

  /**
   * Live one-time-code challenges, keyed by challenge id. A real backend would
   * hash these and expire them server-side; the important part the mock does
   * preserve is that the code never travels to the client — the legacy portal
   * returned it in the response body, making the check cosmetic.
   */
  readonly verificationChallenges = new Map<
    string,
    { email: string; role: UserRole; code: string; channel: 'email' | 'sms' }
  >();

  /** Reset tokens minted by a successful code verification. */
  readonly resetTokens = new Map<string, { email: string; role: UserRole }>();
}
