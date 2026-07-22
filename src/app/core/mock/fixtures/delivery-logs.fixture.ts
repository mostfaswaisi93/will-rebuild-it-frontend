import { DeliveryLog } from '@core/models';

export const seedDeliveryLogs: DeliveryLog[] = [
  { id: 'log-1', channel: 'sms', recipient: '+970591234567', subject: 'Verification code', status: 'delivered', createdAt: '2026-07-21T14:32:00.000Z' },
  { id: 'log-2', channel: 'email', recipient: 'contractor@example.com', subject: 'Estimate approved', status: 'delivered', createdAt: '2026-07-21T13:10:00.000Z' },
  { id: 'log-3', channel: 'sms', recipient: '+970595112233', subject: 'Registration reminder', status: 'failed', error: 'Unreachable handset (network outage)', createdAt: '2026-07-21T11:05:00.000Z' },
  { id: 'log-4', channel: 'email', recipient: 'donor@example.com', subject: 'Winter shelter appeal', status: 'sent', createdAt: '2026-07-21T09:00:00.000Z' },
  { id: 'log-5', channel: 'email', recipient: 'bounced@example.com', subject: 'Statement rejected', status: 'bounced', error: 'Mailbox does not exist', createdAt: '2026-07-20T16:40:00.000Z' },
  { id: 'log-6', channel: 'sms', recipient: '+970598334455', subject: 'Work order dispatched', status: 'delivered', createdAt: '2026-07-20T15:20:00.000Z' },
  { id: 'log-7', channel: 'sms', recipient: '+970599556677', subject: 'Verification code', status: 'queued', createdAt: '2026-07-21T15:00:00.000Z' },
];
