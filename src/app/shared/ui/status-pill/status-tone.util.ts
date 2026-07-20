export type StatusTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'sandStrong';

export type StatusPillContext =
  | 'request'
  | 'project'
  | 'projectPhase'
  | 'estimate'
  | 'funding'
  | 'donation'
  | 'support'
  | 'severity';

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
