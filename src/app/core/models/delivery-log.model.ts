export const LOG_CHANNELS = ['sms', 'email'] as const;
export type LogChannel = (typeof LOG_CHANNELS)[number];

export const LOG_STATUSES = ['queued', 'sent', 'delivered', 'failed', 'bounced'] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

/**
 * A message-delivery record — port of the legacy `logs` (Twilio SMS / SendGrid
 * mail test screens), generalised into an operational delivery log the operator
 * can search when a beneficiary says a code or notification never arrived.
 */
export interface DeliveryLog {
  id: string;
  channel: LogChannel;
  recipient: string;
  subject: string;
  status: LogStatus;
  /** Provider error detail when the status is failed/bounced. */
  error?: string;
  createdAt: string;
}
