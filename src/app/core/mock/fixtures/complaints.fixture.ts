import { Complaint } from '@core/models';

export const seedComplaints: Complaint[] = [
  {
    id: 'complaint-1',
    complaintNumber: 'CMP-2026-00004',
    teamId: 'team-4',
    teamName: 'Rafah Rebuild Workshop',
    projectId: 'project-4',
    description:
      'Debris clearance has been paused for several weeks and I have not received a clear update on when work resumes.',
    reasons: {
      delay: true,
      poorQuality: false,
      specificationMismatch: false,
      misconduct: false,
      otherReason: false,
    },
    attachments: [],
    status: 'open',
    createdAt: '2026-06-05T09:00:00.000Z',
  },
];
