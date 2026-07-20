/**
 * `beneficiary` / `team` / `donor` are the public-facing roles shared with the
 * customer web app. The remaining four are back-office roles that only exist in
 * this admin portal: platform operators, contracting firms and their field
 * staff, and material suppliers.
 */
export const USER_ROLES = [
  'beneficiary',
  'team',
  'donor',
  'admin',
  'contractor',
  'staff',
  'supplier',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles that see the back-office shell rather than the beneficiary/donor shell. */
export const BACK_OFFICE_ROLES = ['admin', 'contractor', 'staff', 'supplier'] as const;
export type BackOfficeRole = (typeof BACK_OFFICE_ROLES)[number];

export const REQUEST_TYPES = ['assessment', 'reconstruction'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ['new', 'underReview', 'matched', 'accepted', 'rejected'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PROPERTY_TYPES = [
  'residential',
  'commercial',
  'agricultural',
  'infrastructure',
  'publicFacility',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const DAMAGE_SEVERITIES = ['partial', 'severe', 'totalLoss'] as const;
export type DamageSeverity = (typeof DAMAGE_SEVERITIES)[number];

/** The seven reconstruction phases, in order (REBUILD_PROMPT Appendix A). */
export const PROJECT_PHASE_KEYS = [
  'damageAssessment',
  'debrisRemoval',
  'designAndPermits',
  'foundation',
  'structure',
  'finishing',
  'handover',
] as const;
export type ProjectPhaseKey = (typeof PROJECT_PHASE_KEYS)[number];

export const PROJECT_STATUSES = ['active', 'onHold', 'completed', 'delivered', 'cancelled'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const FUNDING_STATUSES = ['unfunded', 'partiallyFunded', 'fullyFunded', 'refunded'] as const;
export type FundingStatus = (typeof FUNDING_STATUSES)[number];

export const ESTIMATE_STATUSES = ['pendingApproval', 'approved', 'rejected'] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export const DONATION_STATUSES = ['succeeded', 'processing', 'failed'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const DONATION_FREQUENCIES = ['once', 'monthly'] as const;
export type DonationFrequency = (typeof DONATION_FREQUENCIES)[number];

export const SUPPORT_STATUSES = ['open', 'closed'] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const COMPLAINT_STATUSES = ['open', 'closed'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

/** Gaza governorates, north to south. */
export const GAZA_GOVERNORATES = ['northGaza', 'gazaCity', 'deirAlBalah', 'khanYounis', 'rafah'] as const;
export type GazaGovernorate = (typeof GAZA_GOVERNORATES)[number];

export const CURRENCY = 'USD';

/**
 * Funds are pledged by international donors in USD but disbursed to local
 * contractors and suppliers in shekels, so both currencies are first-class and
 * every monetary amount carries its own currency code.
 */
export const CURRENCIES = ['USD', 'ILS'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

// ---------------------------------------------------------------------------
// Back-office vocabulary (ported from the legacy TopProz portal)
// ---------------------------------------------------------------------------

/** Reconstruction request lifecycle, as worked by operators — richer than the
 * public `REQUEST_STATUSES` because the back office tracks assignment and
 * scheduling states the beneficiary never sees. */
export const WORK_REQUEST_STATUSES = [
  'new',
  'assigned',
  'surveyScheduled',
  'surveyed',
  'estimated',
  'awarded',
  'declined',
  'cancelled',
] as const;
export type WorkRequestStatus = (typeof WORK_REQUEST_STATUSES)[number];

export const WORK_ORDER_STATUSES = [
  'draft',
  'scheduled',
  'dispatched',
  'inProgress',
  'onHold',
  'completed',
  'inspected',
  'closed',
  'cancelled',
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[number];

/** Progress claim ("مستخلص") raised by a contractor against a work order. */
export const STATEMENT_STATUSES = [
  'draft',
  'submitted',
  'underReview',
  'approved',
  'partiallyPaid',
  'paid',
  'rejected',
] as const;
export type StatementStatus = (typeof STATEMENT_STATUSES)[number];

export const DISBURSEMENT_STATUSES = ['pending', 'authorised', 'sent', 'settled', 'failed'] as const;
export type DisbursementStatus = (typeof DISBURSEMENT_STATUSES)[number];

export const DISBURSEMENT_METHODS = ['bankTransfer', 'cheque', 'cash', 'mobileWallet'] as const;
export type DisbursementMethod = (typeof DISBURSEMENT_METHODS)[number];

// --- Materials & warehousing -----------------------------------------------

/** Metric units — the legacy portal was imperial throughout. */
export const UNITS_OF_MEASURE = [
  'piece',
  'bag',
  'squareMetre',
  'cubicMetre',
  'linearMetre',
  'tonne',
  'kilogram',
  'litre',
  'roll',
  'bundle',
] as const;
export type UnitOfMeasure = (typeof UNITS_OF_MEASURE)[number];

export const MATERIAL_CATEGORIES = [
  'cement',
  'aggregate',
  'steel',
  'blocks',
  'timber',
  'insulation',
  'plumbing',
  'electrical',
  'finishing',
  'glazing',
  'tools',
  'safety',
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const STOCK_STATUSES = ['inStock', 'low', 'outOfStock', 'reserved', 'damaged'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const PURCHASE_ORDER_STATUSES = [
  'draft',
  'awaitingApproval',
  'approved',
  'ordered',
  'partiallyReceived',
  'received',
  'cancelled',
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

/** Truck/convoy movements — crossings make transport a tracked stage of its own. */
export const SHIPMENT_STATUSES = [
  'planned',
  'awaitingClearance',
  'atCrossing',
  'inTransit',
  'delivered',
  'rejected',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

// --- Heavy equipment --------------------------------------------------------

export const EQUIPMENT_CATEGORIES = [
  'excavator',
  'bulldozer',
  'loader',
  'crane',
  'dumpTruck',
  'concreteMixer',
  'compactor',
  'generator',
  'waterTanker',
  'scaffolding',
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_STATUSES = [
  'available',
  'booked',
  'inUse',
  'maintenance',
  'outOfService',
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export const EQUIPMENT_PROBLEM_SEVERITIES = ['minor', 'major', 'critical'] as const;
export type EquipmentProblemSeverity = (typeof EQUIPMENT_PROBLEM_SEVERITIES)[number];

// --- People -----------------------------------------------------------------

export const TIMECARD_ACTIVITY_STATUSES = ['clockedIn', 'onBreak', 'clockedOut'] as const;
export type TimecardActivityStatus = (typeof TIMECARD_ACTIVITY_STATUSES)[number];

export const CONTRACTOR_VERIFICATION_STATUSES = [
  'pending',
  'documentsRequested',
  'verified',
  'suspended',
  'rejected',
] as const;
export type ContractorVerificationStatus = (typeof CONTRACTOR_VERIFICATION_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'pastDue', 'cancelled', 'expired'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const INSPECTION_KINDS = ['preWork', 'postWork'] as const;
export type InspectionKind = (typeof INSPECTION_KINDS)[number];
