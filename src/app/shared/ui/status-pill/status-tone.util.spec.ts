import {
  DAMAGE_SEVERITIES,
  DONATION_STATUSES,
  ESTIMATE_STATUSES,
  FUNDING_STATUSES,
  PROJECT_STATUSES,
  ProjectPhase,
  REQUEST_STATUSES,
  BENEFICIARY_STATUSES,
  STATEMENT_STATUSES,
  DISBURSEMENT_STATUSES,
  CAMPAIGN_STATUSES,
  LOG_STATUSES,
  STAFF_STATUSES,
  SUBSCRIPTION_STATUSES,
  SHIPMENT_STATUSES,
  COMPLAINT_STATUSES,
  EQUIPMENT_PROBLEM_SEVERITIES,
  EQUIPMENT_STATUSES,
  PURCHASE_ORDER_STATUSES,
  STOCK_STATUSES,
  SUPPLIER_STATUSES,
  SUPPORT_STATUSES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
} from '@core/models';
import { resolveStatusTone, StatusPillContext, StatusTone } from './status-tone.util';

/**
 * `ProjectPhase['status']` has no exported constant array, so mirror it here.
 * Typing the array against the model means dropping or renaming a phase status
 * in the model breaks compilation of this spec.
 */
const PROJECT_PHASE_STATUSES: readonly ProjectPhase['status'][] = ['pending', 'inProgress', 'completed'];

/** Every (context, status) pair the app is expected to render, with its known tone. */
const EXPECTED: Record<StatusPillContext, Readonly<Record<string, StatusTone>>> = {
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
  shipment: {
    planned: 'neutral',
    awaitingClearance: 'warning',
    atCrossing: 'info',
    inTransit: 'brand',
    delivered: 'success',
    rejected: 'danger',
  },
  complaint: {
    open: 'info',
    closed: 'neutral',
  },
};

/** The status values whose real, intended tone happens to be `neutral`. */
const INTENTIONALLY_NEUTRAL: Readonly<Record<string, readonly string[]>> = {
  project: ['cancelled'],
  projectPhase: ['pending'],
  support: ['closed'],
  // Terminal or not-yet-started work-order states carry no urgency colour.
  workOrder: ['draft', 'closed', 'cancelled'],
  workOrderPriority: ['low'],
  statement: ['draft'],
  supplier: ['suspended'],
  purchaseOrder: ['draft', 'cancelled'],
  disbursement: ['pending'],
  staff: ['inactive'],
  campaign: ['draft', 'cancelled'],
  deliveryLog: ['queued'],
  subscription: ['cancelled'],
  shipment: ['planned'],
  complaint: ['closed'],
};

/** Pairs each context with the constant array that defines its full status domain. */
const CONTEXT_DOMAINS: readonly { context: StatusPillContext; statuses: readonly string[] }[] = [
  { context: 'request', statuses: REQUEST_STATUSES },
  { context: 'project', statuses: PROJECT_STATUSES },
  { context: 'projectPhase', statuses: PROJECT_PHASE_STATUSES },
  { context: 'estimate', statuses: ESTIMATE_STATUSES },
  { context: 'funding', statuses: FUNDING_STATUSES },
  { context: 'donation', statuses: DONATION_STATUSES },
  { context: 'support', statuses: SUPPORT_STATUSES },
  { context: 'severity', statuses: DAMAGE_SEVERITIES },
  { context: 'workOrder', statuses: WORK_ORDER_STATUSES },
  { context: 'workOrderPriority', statuses: WORK_ORDER_PRIORITIES },
  { context: 'statement', statuses: STATEMENT_STATUSES },
  { context: 'beneficiary', statuses: BENEFICIARY_STATUSES },
  { context: 'supplier', statuses: SUPPLIER_STATUSES },
  { context: 'purchaseOrder', statuses: PURCHASE_ORDER_STATUSES },
  { context: 'stock', statuses: STOCK_STATUSES },
  { context: 'equipment', statuses: EQUIPMENT_STATUSES },
  { context: 'equipmentProblem', statuses: EQUIPMENT_PROBLEM_SEVERITIES },
  { context: 'disbursement', statuses: DISBURSEMENT_STATUSES },
  { context: 'staff', statuses: STAFF_STATUSES },
  { context: 'campaign', statuses: CAMPAIGN_STATUSES },
  { context: 'deliveryLog', statuses: LOG_STATUSES },
  { context: 'subscription', statuses: SUBSCRIPTION_STATUSES },
  { context: 'shipment', statuses: SHIPMENT_STATUSES },
  { context: 'complaint', statuses: COMPLAINT_STATUSES },
];

describe('resolveStatusTone', () => {
  describe('tone and label key for every known status', () => {
    for (const { context, statuses } of CONTEXT_DOMAINS) {
      for (const status of statuses) {
        it(`maps ${context}/${status} to the "${EXPECTED[context][status]}" tone and its own label key`, () => {
          expect(resolveStatusTone(context, status)).toEqual({
            tone: EXPECTED[context][status],
            labelKey: `shared.statusPill.${context}.${status}`,
          });
        });
      }
    }
  });

  describe('completeness guard across every status constant', () => {
    for (const { context, statuses } of CONTEXT_DOMAINS) {
      it(`gives every ${context} status listed in its constant a deliberate, non-fallback tone`, () => {
        const neutralByDesign = INTENTIONALLY_NEUTRAL[context] ?? [];
        const unmapped = statuses.filter(
          (status) => resolveStatusTone(context, status).tone === 'neutral' && !neutralByDesign.includes(status),
        );

        expect(unmapped)
          .withContext(
            `these ${context} statuses fell back to the neutral tone, which means they are missing from ` +
              'CONTEXT_TONES in status-tone.util.ts (or are neutral on purpose and belong in INTENTIONALLY_NEUTRAL here)',
          )
          .toEqual([]);
      });

      it(`returns a tone that is one of the declared StatusTone values for every ${context} status`, () => {
        const allowedTones: readonly StatusTone[] = [
          'brand',
          'success',
          'warning',
          'danger',
          'info',
          'neutral',
          'sandStrong',
        ];

        for (const status of statuses) {
          const { tone } = resolveStatusTone(context, status);
          expect(allowedTones).withContext(`${context}/${status} produced "${tone}"`).toContain(tone);
        }
      });
    }

    it('covers exactly the contexts the pill supports, so a new context cannot slip in untested', () => {
      expect(CONTEXT_DOMAINS.map((entry) => entry.context)).toEqual([
        'request',
        'project',
        'projectPhase',
        'estimate',
        'funding',
        'donation',
        'support',
        'severity',
        'workOrder',
        'workOrderPriority',
        'statement',
        'beneficiary',
        'supplier',
        'purchaseOrder',
        'stock',
        'equipment',
        'equipmentProblem',
        'disbursement',
        'staff',
        'campaign',
        'deliveryLog',
        'subscription',
        'shipment',
        'complaint',
      ]);
    });
  });

  describe('fallback behaviour for unrecognised status values', () => {
    it('falls back to the neutral tone rather than throwing when the backend sends an unknown status', () => {
      expect(resolveStatusTone('request', 'quantumSuperposition').tone).toBe('neutral');
    });

    it('still builds a label key for an unknown status so the missing translation is visible', () => {
      expect(resolveStatusTone('project', 'mothballed').labelKey).toBe('shared.statusPill.project.mothballed');
    });

    it('falls back for an empty status string', () => {
      expect(resolveStatusTone('estimate', '')).toEqual({
        tone: 'neutral',
        labelKey: 'shared.statusPill.estimate.',
      });
    });

    it('does not leak a status from one context into another', () => {
      // `accepted` is a request status only; asking the estimate context must not resolve it.
      expect(resolveStatusTone('estimate', 'accepted').tone).toBe('neutral');
      // `approved` is an estimate status only.
      expect(resolveStatusTone('request', 'approved').tone).toBe('neutral');
    });

    it('falls back to neutral for status names that collide with Object.prototype members', () => {
      // Regression guard: the lookup previously used `?? 'neutral'`, which only
      // falls back on null/undefined — so an inherited prototype member resolved
      // to a *function* as the tone. Now an own-property check, so these are
      // treated as the unknown values they are.
      for (const inherited of ['toString', 'constructor', 'valueOf', 'hasOwnProperty']) {
        expect(resolveStatusTone('request', inherited).tone)
          .withContext(`status "${inherited}" must not leak from the prototype`)
          .toBe('neutral');
      }
    });

    it('still builds a normal label key for a prototype-shaped status name', () => {
      expect(resolveStatusTone('request', 'toString').labelKey).toBe('shared.statusPill.request.toString');
    });

    it('falls back to neutral for ordinary unknown names that are not on Object.prototype', () => {
      for (const bogus of ['pending', 'archived', 'foo', 'undefined', 'null']) {
        expect(resolveStatusTone('request', bogus).tone).toBe('neutral');
      }
    });
  });

  describe('label key construction', () => {
    it('namespaces the key by context so two contexts sharing a status name get distinct keys', () => {
      expect(resolveStatusTone('request', 'rejected').labelKey).toBe('shared.statusPill.request.rejected');
      expect(resolveStatusTone('estimate', 'rejected').labelKey).toBe('shared.statusPill.estimate.rejected');
    });

    it('produces a unique label key for every known (context, status) pair', () => {
      const keys = CONTEXT_DOMAINS.flatMap(({ context, statuses }) =>
        statuses.map((status) => resolveStatusTone(context, status).labelKey),
      );

      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});
