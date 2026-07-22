import { MonitoringReport } from '@core/models';

export const seedMonitoringReports: MonitoringReport[] = [
  {
    id: 'mon-1',
    source: 'unHabitat',
    projectId: 'project-1',
    projectTitle: 'Al-Najjar Family Home Reconstruction',
    teamName: 'Amal Builders Cooperative',
    score: 4.6,
    summary: 'Structural work meets standard; minor snagging noted on finishing. Occupancy approved.',
    reportedAt: '2026-06-30T09:00:00.000Z',
  },
  {
    id: 'mon-2',
    source: 'engineersSyndicate',
    projectId: 'project-2',
    projectTitle: 'Deir al-Balah Water Line Restoration',
    teamName: 'Sumoud Engineering Group',
    score: 4.9,
    summary: 'Pressure testing passed on first attempt; workmanship commended.',
    reportedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'mon-3',
    source: 'donorAudit',
    projectId: 'project-6',
    projectTitle: 'Jabalia Community Centre Restoration',
    teamName: 'Amal Builders Cooperative',
    score: 3.8,
    summary: 'On budget but two weeks behind schedule; corrective plan requested and received.',
    reportedAt: '2026-06-12T09:00:00.000Z',
  },
  {
    id: 'mon-4',
    source: 'localCouncil',
    projectId: 'project-5',
    projectTitle: 'Barghouth Home Debris Clearance',
    teamName: 'Gaza Restoration Guild',
    score: 3.2,
    summary: 'Debris cleared but disposal site not fully compliant; follow-up scheduled.',
    reportedAt: '2026-06-24T09:00:00.000Z',
  },
];
