import { StatementStatus } from './domain.constants';

/**
 * One claimed line on a progress claim — the work done since the last
 * statement, valued against the estimate. `estimateItemId` links back to the
 * BoQ line it draws down, so cumulative claims can be checked against the
 * approved quantity.
 */
export interface StatementLine {
  id: string;
  estimateItemId?: string;
  description: string;
  /** Quantity completed in this claim period. */
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
}

/**
 * A contractor's progress claim ("مستخلص") against a work order. Construction
 * statements hold back a retention percentage as a defects guarantee, released
 * later — so the net payable is the gross claim minus retention.
 */
export interface Statement {
  id: string;
  statementNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  projectId: string;
  projectTitle: string;
  teamId: string;
  teamName: string;
  status: StatementStatus;
  /** Sequential claim number for this work order (1st, 2nd interim, final…). */
  sequence: number;
  lines: StatementLine[];
  /** Sum of line amounts, before retention. */
  grossAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  /** grossAmount − retentionAmount — what the contractor is actually owed. */
  netAmount: number;
  /** Set by the reviewer; may differ from `netAmount` if lines are queried. */
  approvedAmount: number;
  paidAmount: number;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}
