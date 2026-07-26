import { MembershipPlan, Subscription, SubscriptionPayment, SubscriptionPlan } from '@core/models';

function payment(
  id: string,
  amount: number,
  paidAt: string,
  method: SubscriptionPayment['method'] = 'bankTransfer',
  refunded = false,
): SubscriptionPayment {
  return { id, amount, currency: 'USD', paidAt, method, refunded };
}

export const seedSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    subscriptionNumber: 'MEM-2026-0012',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    plan: 'premium',
    status: 'active',
    amount: 1200,
    currency: 'USD',
    startedAt: '2026-01-10T09:00:00.000Z',
    renewsAt: '2027-01-10T09:00:00.000Z',
    payments: [payment('sp-1-1', 1200, '2026-01-10T09:00:00.000Z')],
  },
  {
    id: 'sub-2',
    subscriptionNumber: 'MEM-2026-0018',
    teamId: 'team-3',
    teamName: 'Sumoud Engineering Group',
    plan: 'standard',
    status: 'active',
    amount: 600,
    currency: 'USD',
    startedAt: '2026-02-01T09:00:00.000Z',
    renewsAt: '2027-02-01T09:00:00.000Z',
    payments: [payment('sp-2-1', 600, '2026-02-01T09:00:00.000Z', 'cheque')],
  },
  {
    id: 'sub-3',
    subscriptionNumber: 'MEM-2026-0024',
    teamId: 'team-2',
    teamName: 'Gaza Restoration Guild',
    plan: 'standard',
    status: 'pastDue',
    amount: 600,
    currency: 'USD',
    startedAt: '2025-06-15T09:00:00.000Z',
    renewsAt: '2026-06-15T09:00:00.000Z',
    payments: [payment('sp-3-1', 600, '2025-06-15T09:00:00.000Z')],
  },
  {
    id: 'sub-4',
    subscriptionNumber: 'MEM-2026-0031',
    teamId: 'team-4',
    teamName: 'Rafah Rebuild Workshop',
    plan: 'standard',
    status: 'trial',
    amount: 600,
    currency: 'USD',
    startedAt: '2026-07-05T09:00:00.000Z',
    renewsAt: '2026-08-05T09:00:00.000Z',
    payments: [],
  },
  {
    id: 'sub-5',
    subscriptionNumber: 'MEM-2025-0104',
    teamId: 'team-2',
    teamName: 'Gaza Restoration Guild',
    plan: 'premium',
    status: 'cancelled',
    amount: 1200,
    currency: 'USD',
    startedAt: '2025-03-01T09:00:00.000Z',
    renewsAt: '2026-03-01T09:00:00.000Z',
    payments: [payment('sp-5-1', 1200, '2025-03-01T09:00:00.000Z', 'bankTransfer', true)],
  },
];

/**
 * The membership tiers, held in BOTH languages. Commercial terms are backend
 * content, so the handler resolves them per request from `lang` rather than the
 * UI dictionaries — same contract as the assessment questionnaire.
 *
 * `fee` must agree with the `amount` on the seeded subscriptions above (600 /
 * 1200 USD): a catalogue that disagrees with what teams are actually billed is
 * worse than no catalogue.
 */
interface LocalizedPlan {
  plan: SubscriptionPlan;
  nameEn: string;
  nameAr: string;
  summaryEn: string;
  summaryAr: string;
  fee: number;
  featuresEn: string[];
  featuresAr: string[];
}

export const seedMembershipPlans: LocalizedPlan[] = [
  {
    plan: 'standard',
    nameEn: 'Standard membership',
    nameAr: 'العضوية الأساسية',
    summaryEn: 'Verified status and eligibility to bid on reconstruction tenders.',
    summaryAr: 'توثيق الفريق وأهليّته للتقدّم لمناقصات الإعمار.',
    fee: 600,
    featuresEn: [
      'Annual licence and insurance verification',
      'Eligible to bid on open tenders',
      'Up to 3 concurrent work orders',
      'Submit estimates and payment statements',
    ],
    featuresAr: [
      'تحقّق سنوي من الرخصة والتأمين',
      'الأهلية للتقدّم للمناقصات المفتوحة',
      'حتى ٣ أوامر عمل متزامنة',
      'تقديم التقديرات والمستخلصات',
    ],
  },
  {
    plan: 'premium',
    nameEn: 'Premium membership',
    nameAr: 'العضوية الموسّعة',
    summaryEn: 'For firms running several sites at once, with equipment and warehouse access.',
    summaryAr: 'للفرق التي تدير عدّة مواقع في وقت واحد، مع صلاحية المعدّات والمستودعات.',
    fee: 1200,
    featuresEn: [
      'Everything in Standard membership',
      'Unlimited concurrent work orders',
      'Heavy equipment booking',
      'Raise purchase orders against warehouse stock',
      'Priority review on payment statements',
    ],
    featuresAr: [
      'كل ما في العضوية الأساسية',
      'أوامر عمل متزامنة بلا حدّ',
      'حجز المعدّات الثقيلة',
      'إصدار أوامر شراء على مخزون المستودعات',
      'أولوية في مراجعة المستخلصات',
    ],
  },
];

/**
 * Resolves the catalogue for one locale and folds in how many teams actually
 * hold each tier — counted from the live subscriptions rather than stored, so
 * the figure cannot drift from the register it describes.
 */
export function localizeMembershipPlans(
  plans: LocalizedPlan[],
  subscriptions: Subscription[],
  lang: string,
): MembershipPlan[] {
  const isArabic = lang === 'ar';
  return plans.map((plan) => ({
    plan: plan.plan,
    name: isArabic ? plan.nameAr : plan.nameEn,
    summary: isArabic ? plan.summaryAr : plan.summaryEn,
    fee: plan.fee,
    currency: 'USD' as const,
    features: isArabic ? plan.featuresAr : plan.featuresEn,
    activeTeams: subscriptions.filter((sub) => sub.plan === plan.plan && sub.status === 'active')
      .length,
  }));
}
