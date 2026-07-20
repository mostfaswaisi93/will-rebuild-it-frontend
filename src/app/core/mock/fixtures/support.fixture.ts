import { SupportTicket } from '@core/models';

export const seedSupportTickets: SupportTicket[] = [
  {
    id: 'support-1',
    ticketNumber: 'SUP-2026-00012',
    projectId: 'project-1',
    projectTitle: 'Al-Najjar Family Home Reconstruction',
    subject: 'Question about the structure phase timeline',
    description:
      'Could you help me understand why the structural frame phase is taking longer than the earlier phases?',
    status: 'open',
    messages: [
      {
        id: 'support-1-msg-1',
        author: 'beneficiary',
        body: 'Could you help me understand why the structural frame phase is taking longer than the earlier phases?',
        createdAt: '2026-06-02T09:00:00.000Z',
      },
      {
        id: 'support-1-msg-2',
        author: 'support',
        body: 'The structural frame requires curing time between pours for safety. Your team will share updated photos this week.',
        createdAt: '2026-06-02T13:20:00.000Z',
      },
    ],
    createdAt: '2026-06-02T09:00:00.000Z',
  },
  {
    id: 'support-2',
    ticketNumber: 'SUP-2026-00008',
    projectId: 'project-3',
    projectTitle: 'Sabbah Family Home Rebuild',
    subject: 'Updating my contact number',
    description: 'I changed my phone number and want to make sure the team can still reach me.',
    status: 'closed',
    messages: [
      {
        id: 'support-2-msg-1',
        author: 'beneficiary',
        body: 'I changed my phone number and want to make sure the team can still reach me.',
        createdAt: '2026-04-14T09:00:00.000Z',
      },
      {
        id: 'support-2-msg-2',
        author: 'support',
        body: 'Thank you — please update it from your Profile page and the change will reach your team automatically. Closing this ticket.',
        createdAt: '2026-04-14T10:05:00.000Z',
      },
    ],
    createdAt: '2026-04-14T09:00:00.000Z',
  },
];
