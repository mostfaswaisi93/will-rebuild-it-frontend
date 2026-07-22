export type StatusTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'sandStrong';

export type StatusPillContext =
  | 'request'
  | 'project'
  | 'projectPhase'
  | 'estimate'
  | 'funding'
  | 'donation'
  | 'support'
  | 'severity'
  | 'workOrder'
  | 'workOrderPriority'
  | 'statement'
  | 'beneficiary'
  | 'supplier'
  | 'purchaseOrder'
  | 'stock'
  | 'equipment'
  | 'equipmentProblem'
  | 'disbursement'
  | 'staff'
  | 'campaign'
  | 'deliveryLog'
  | 'subscription';

export interface StatusToneResult {
  tone: StatusTone;
  labelKey: string;
}

type ToneMap = Record<string, StatusTone>;

const CONTEXT_TONES: Record<StatusPillContext, ToneMap> = {
  request: {
    new: 'info',
    underReview: 'info',
    matched: 'info',
    accepted: 'brand',
    rejected: 'danger',
  },
  project: {
    active: 'info',
    onHold: 'warning',
    completed: 'success',
    delivered: 'success',
    cancelled: 'neutral',
  },
  projectPhase: {
    pending: 'neutral',
    inProgress: 'info',
    completed: 'success',
  },
  estimate: {
    pendingApproval: 'warning',
    approved: 'success',
    rejected: 'danger',
  },
  funding: {
    unfunded: 'danger',
    partiallyFunded: 'warning',
    fullyFunded: 'success',
    refunded: 'info',
  },
  donation: {
    succeeded: 'success',
    processing: 'warning',
    failed: 'danger',
  },
  support: {
    open: 'info',
    closed: 'neutral',
  },
  severity: {
    partial: 'warning',
    severe: 'sandStrong',
    totalLoss: 'danger',
  },
  workOrder: {
    draft: 'neutral',
    scheduled: 'info',
    dispatched: 'info',
    inProgress: 'brand',
    onHold: 'warning',
    completed: 'success',
    inspected: 'success',
    closed: 'neutral',
    cancelled: 'neutral',
  },
  workOrderPriority: {
    low: 'neutral',
    normal: 'info',
    high: 'warning',
    urgent: 'danger',
  },
  statement: {
    draft: 'neutral',
    submitted: 'info',
    underReview: 'warning',
    approved: 'success',
    partiallyPaid: 'info',
    paid: 'success',
    rejected: 'danger',
  },
  beneficiary: {
    pending: 'warning',
    verified: 'success',
    rejected: 'danger',
  },
  supplier: {
    pending: 'warning',
    approved: 'success',
    suspended: 'neutral',
  },
  purchaseOrder: {
    draft: 'neutral',
    awaitingApproval: 'warning',
    approved: 'info',
    ordered: 'brand',
    partiallyReceived: 'info',
    received: 'success',
    cancelled: 'neutral',
  },
  stock: {
    inStock: 'success',
    low: 'warning',
    outOfStock: 'danger',
    reserved: 'info',
    damaged: 'danger',
  },
  equipment: {
    available: 'success',
    booked: 'info',
    inUse: 'brand',
    maintenance: 'warning',
    outOfService: 'danger',
  },
  equipmentProblem: {
    minor: 'warning',
    major: 'sandStrong',
    critical: 'danger',
  },
  disbursement: {
    pending: 'neutral',
    authorised: 'info',
    sent: 'brand',
    settled: 'success',
    failed: 'danger',
  },
  staff: {
    active: 'success',
    onLeave: 'warning',
    inactive: 'neutral',
  },
  campaign: {
    draft: 'neutral',
    scheduled: 'info',
    active: 'brand',
    completed: 'success',
    cancelled: 'neutral',
  },
  deliveryLog: {
    queued: 'neutral',
    sent: 'info',
    delivered: 'success',
    failed: 'danger',
    bounced: 'danger',
  },
  subscription: {
    trial: 'info',
    active: 'success',
    pastDue: 'warning',
    cancelled: 'neutral',
    expired: 'danger',
  },
};

/**
 * Resolves a (context, statusValue) pair to a display tone and the
 * translation key for its label. Unknown status values fall back to the
 * `neutral` tone so an unexpected backend value never crashes rendering.
 */
export function resolveStatusTone(context: StatusPillContext, status: string): StatusToneResult {
  // `Object.hasOwn`, not `??`: the tone maps are plain object literals, so a
  // status like "toString" or "constructor" would otherwise resolve to the
  // inherited Object.prototype member instead of falling back to neutral.
  const tones = CONTEXT_TONES[context];
  const tone = Object.hasOwn(tones, status) ? tones[status] : 'neutral';
  return {
    tone,
    labelKey: `shared.statusPill.${context}.${status}`,
  };
}
