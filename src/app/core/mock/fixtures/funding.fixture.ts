import { Disbursement, Funding } from '@core/models';

function disbursement(
  id: string,
  fundingId: string,
  amount: number,
  funderName: string,
  disbursedAt: string,
  opts: Partial<Pick<Disbursement, 'isVoided' | 'isRefunded' | 'receiptUrl'>> = {},
): Disbursement {
  return {
    id,
    fundingId,
    amount,
    funderName,
    disbursedAt,
    receiptUrl: opts.receiptUrl,
    isVoided: opts.isVoided ?? false,
    isRefunded: opts.isRefunded ?? false,
  };
}

export const seedFunding: Funding[] = [
  {
    id: 'funding-1',
    fundingNumber: 'FND-2026-00071',
    projectId: 'project-1',
    projectTitle: 'Al-Najjar Family Home Reconstruction',
    phaseKey: 'structure',
    status: 'partiallyFunded',
    fundedAmount: 5200,
    outstandingAmount: 1520,
    refundedAmount: 0,
    disbursements: [
      disbursement('disb-1-1', 'funding-1', 3000, 'Gaza Solidarity Fund', '2026-04-02T09:00:00.000Z'),
      disbursement('disb-1-2', 'funding-1', 2200, 'Amina Haddad', '2026-05-10T09:00:00.000Z'),
    ],
    createdAt: '2026-03-30T09:00:00.000Z',
  },
  {
    id: 'funding-2',
    fundingNumber: 'FND-2026-00042',
    projectId: 'project-2',
    projectTitle: 'Deir al-Balah Water Line Restoration',
    phaseKey: 'handover',
    status: 'fullyFunded',
    fundedAmount: 8760,
    outstandingAmount: 0,
    refundedAmount: 0,
    disbursements: [
      disbursement('disb-2-1', 'funding-2', 6000, 'Municipal Recovery Grant', '2025-12-22T09:00:00.000Z'),
      disbursement('disb-2-2', 'funding-2', 2760, 'Gaza Solidarity Fund', '2026-01-15T09:00:00.000Z'),
    ],
    receiptConfirmedAt: '2026-03-05T09:00:00.000Z',
    createdAt: '2025-12-21T09:00:00.000Z',
  },
  {
    id: 'funding-3',
    fundingNumber: 'FND-2026-00089',
    projectId: 'project-3',
    projectTitle: 'Sabbah Family Home Rebuild',
    phaseKey: 'foundation',
    status: 'unfunded',
    fundedAmount: 0,
    outstandingAmount: 6420,
    refundedAmount: 0,
    disbursements: [],
    createdAt: '2026-04-12T09:00:00.000Z',
  },
  {
    id: 'funding-4',
    fundingNumber: 'FND-2026-00103',
    projectId: 'project-4',
    projectTitle: 'Owda Greenhouse Restoration',
    phaseKey: 'debrisRemoval',
    status: 'partiallyFunded',
    fundedAmount: 900,
    outstandingAmount: 2100,
    refundedAmount: 300,
    disbursements: [
      disbursement('disb-4-1', 'funding-4', 1200, 'Rural Recovery Initiative', '2026-05-01T09:00:00.000Z'),
      disbursement('disb-4-2', 'funding-4', 300, 'Rural Recovery Initiative', '2026-05-20T09:00:00.000Z', {
        isRefunded: true,
      }),
    ],
    createdAt: '2026-04-25T09:00:00.000Z',
  },
];
