import { AppNotification } from '@core/models';

export const seedNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New progress photos added',
    body: 'Amal Builders Cooperative added photos to the Structure phase of your home reconstruction.',
    isRead: false,
    createdAt: '2026-07-13T08:30:00.000Z',
    linkUrl: '/app/projects/project-1',
  },
  {
    id: 'notif-2',
    title: 'Disbursement received',
    body: 'A disbursement of $2,200 was applied to the Al-Najjar Family Home Reconstruction funding.',
    isRead: false,
    createdAt: '2026-05-10T09:10:00.000Z',
    linkUrl: '/app/funding/funding-1',
  },
  {
    id: 'notif-3',
    title: 'Estimate approved',
    body: 'Your cost estimate EST-2026-00051 has been approved and is ready for funding.',
    isRead: true,
    createdAt: '2026-03-28T09:05:00.000Z',
    linkUrl: '/app/estimates/estimate-1',
  },
  {
    id: 'notif-4',
    title: 'Support reply',
    body: 'Support replied to your ticket SUP-2026-00012.',
    isRead: true,
    createdAt: '2026-06-02T13:25:00.000Z',
    linkUrl: '/app/support/support-1',
  },
];
