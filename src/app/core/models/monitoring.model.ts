export const MONITORING_SOURCES = ['unHabitat', 'engineersSyndicate', 'donorAudit', 'localCouncil'] as const;
export type MonitoringSource = (typeof MONITORING_SOURCES)[number];

/**
 * An independent third-party assessment of a reconstruction project — the
 * reconstruction analogue of the legacy `social` (Yelp/Google) external
 * ratings. In aid work the meaningful "external rating" is oversight: UN-Habitat
 * inspections, the Engineers' Syndicate, donor audits, local councils — not
 * consumer review sites, which don't exist in this context.
 */
export interface MonitoringReport {
  id: string;
  source: MonitoringSource;
  projectId: string;
  projectTitle: string;
  teamName: string;
  /** 0–5 quality score from the assessing body. */
  score: number;
  summary: string;
  reportedAt: string;
}
