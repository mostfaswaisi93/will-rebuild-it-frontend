import { CurrencyCode, DisbursementMethod, DisbursementStatus } from './domain.constants';

/**
 * A single money movement out of the platform to a contracting team, usually
 * against an approved progress claim (statement). Named `Payout` to avoid a
 * clash with funding's `Disbursement` (money coming IN from donors); this is
 * the pay-OUT ledger. The UI calls both "الصرف / disbursements".
 *
 * The lifecycle mirrors how a real transfer clears: pending → authorised → sent
 * → settled, with `failed` as the off-ramp (a bounced transfer, a stopped
 * cheque).
 */
export interface Payout {
  id: string;
  payoutNumber: string;
  /** The statement this pays, when it settles a progress claim. */
  statementId?: string;
  statementNumber?: string;
  teamId: string;
  teamName: string;
  amount: number;
  currency: CurrencyCode;
  method: DisbursementMethod;
  status: DisbursementStatus;
  /** Bank transfer reference, cheque number, wallet transaction id. */
  reference?: string;
  createdAt: string;
  settledAt?: string;
}
