import { Statement, StatementLine } from '@core/models';

function line(
  id: string,
  description: string,
  quantity: number,
  unit: string,
  unitRate: number,
  estimateItemId?: string,
): StatementLine {
  return { id, estimateItemId, description, quantity, unit, unitRate, amount: quantity * unitRate };
}

/** Gross → retention → net, from a set of lines and a retention percentage. */
function amounts(lines: StatementLine[], retentionPercent: number) {
  const grossAmount = lines.reduce((sum, item) => sum + item.amount, 0);
  const retentionAmount = Math.round(grossAmount * retentionPercent) / 100;
  return { grossAmount, retentionPercent, retentionAmount, netAmount: grossAmount - retentionAmount };
}

const s1Lines = [
  line('sl-1-1', 'Structural frame concrete — poured', 14, 'm³', 180, 'boq-1-1'),
  line('sl-1-2', 'Steel rebar — fixed', 1.2, 'ton', 850, 'boq-1-2'),
  line('sl-1-3', 'Masonry crew', 18, 'day', 45, 'boq-1-4'),
];

const s2Lines = [
  line('sl-2-1', 'Water pipe laid', 320, 'm', 14, 'boq-2-1'),
  line('sl-2-2', 'Fittings and valves', 1, 'lot', 1800, 'boq-2-2'),
  line('sl-2-3', 'Trenching crew', 18, 'day', 40, 'boq-2-3'),
  line('sl-2-4', 'Excavator rental', 5, 'day', 220, 'boq-2-4'),
];

const s3Lines = [line('sl-3-1', 'Debris removal and haulage', 6, 'skip', 90)];

export const seedStatements: Statement[] = [
  {
    id: 'stmt-1',
    statementNumber: 'STM-2026-00031',
    workOrderId: 'wo-1',
    workOrderNumber: 'WO-2026-00071',
    projectId: 'project-1',
    projectTitle: 'Al-Najjar Family Home Reconstruction',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    status: 'submitted',
    sequence: 1,
    lines: s1Lines,
    ...amounts(s1Lines, 5),
    approvedAmount: 0,
    paidAmount: 0,
    submittedAt: '2026-05-20T09:00:00.000Z',
    createdAt: '2026-05-19T09:00:00.000Z',
  },
  {
    id: 'stmt-2',
    statementNumber: 'STM-2026-00024',
    workOrderId: 'wo-2',
    workOrderNumber: 'WO-2026-00068',
    projectId: 'project-2',
    projectTitle: 'Deir al-Balah Water Line Restoration',
    teamId: 'team-3',
    teamName: 'Sumoud Engineering Group',
    status: 'paid',
    sequence: 1,
    lines: s2Lines,
    ...amounts(s2Lines, 5),
    approvedAmount: 0,
    paidAmount: 0,
    submittedAt: '2026-01-24T09:00:00.000Z',
    reviewedAt: '2026-01-26T09:00:00.000Z',
    createdAt: '2026-01-23T09:00:00.000Z',
  },
  {
    id: 'stmt-3',
    statementNumber: 'STM-2026-00040',
    workOrderId: 'wo-5',
    workOrderNumber: 'WO-2026-00060',
    projectId: 'project-6',
    projectTitle: 'Jabalia Community Centre Restoration',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    status: 'underReview',
    sequence: 2,
    lines: s3Lines,
    ...amounts(s3Lines, 5),
    approvedAmount: 0,
    paidAmount: 0,
    submittedAt: '2026-06-10T09:00:00.000Z',
    createdAt: '2026-06-09T09:00:00.000Z',
  },
  {
    id: 'stmt-4',
    statementNumber: 'STM-2026-00018',
    workOrderId: 'wo-2',
    workOrderNumber: 'WO-2026-00068',
    projectId: 'project-2',
    projectTitle: 'Deir al-Balah Water Line Restoration',
    teamId: 'team-3',
    teamName: 'Sumoud Engineering Group',
    status: 'rejected',
    sequence: 1,
    lines: s3Lines,
    ...amounts(s3Lines, 5),
    approvedAmount: 0,
    paidAmount: 0,
    submittedAt: '2025-12-30T09:00:00.000Z',
    reviewedAt: '2026-01-02T09:00:00.000Z',
    rejectionReason: 'Claimed skip count exceeds the volume of debris recorded on the site log.',
    createdAt: '2025-12-29T09:00:00.000Z',
  },
];

// Statement 2 was approved and fully paid — reflect that on the record.
const paid = seedStatements[1]!;
paid.approvedAmount = paid.netAmount;
paid.paidAmount = paid.netAmount;
