export const CAMPAIGN_CHANNELS = ['email', 'sms', 'social'] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

export const CAMPAIGN_AUDIENCES = ['donors', 'beneficiaries', 'contractors'] as const;
export type CampaignAudience = (typeof CAMPAIGN_AUDIENCES)[number];

export const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'active', 'completed', 'cancelled'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/**
 * An awareness / fundraising outreach campaign — port of the legacy
 * `promotions`. Reframed from a marketing product to reconstruction outreach:
 * donor fundraising drives, beneficiary registration awareness, contractor
 * calls-for-tender.
 */
export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  audience: CampaignAudience;
  status: CampaignStatus;
  subject: string;
  message: string;
  audienceSize: number;
  sentCount: number;
  /**
   * Outreach is funded from the same donor money as the work, so a campaign
   * carries a budget and what it has actually spent. Ports the legacy
   * `promotions/budget` screen onto the campaign itself rather than a separate
   * page — the figure is meaningless away from the campaign it belongs to.
   */
  budget?: number;
  spent?: number;
  currency?: string;
  scheduledFor?: string;
  createdAt: string;
}
