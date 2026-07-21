/**
 * A contractor performance scorecard. Computed on the fly from teams, work
 * orders and statements — not stored — so it is always current. Ports the
 * legacy `scorecard` concept into a reconstruction-quality lens: rating,
 * throughput, and how clean their claims are.
 */
export interface ContractorScorecard {
  teamId: string;
  teamName: string;
  averageRating: number;
  completedProjects: number;
  workOrdersTotal: number;
  workOrdersCompleted: number;
  /** completed ÷ total, 0–1; 0 when the team has no work orders. */
  completionRate: number;
  statementsTotal: number;
  statementsApproved: number;
  statementsRejected: number;
  /** approved ÷ (approved + rejected), 0–1; the "clean claim" signal. */
  approvalRate: number;
  /** Weighted composite, 0–100. */
  overallScore: number;
}
