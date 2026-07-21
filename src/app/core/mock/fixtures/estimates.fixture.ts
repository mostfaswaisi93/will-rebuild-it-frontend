import { BoqItem, Estimate } from '@core/models';

function line(
  id: string,
  category: BoqItem['category'],
  description: string,
  quantity: number,
  unit: string,
  unitCost: number,
): BoqItem {
  return { id, category, description, quantity, unit, unitCost, totalCost: quantity * unitCost };
}

const estimate1Items: BoqItem[] = [
  line('boq-1-1', 'materials', 'Reinforced concrete (structural frame)', 22, 'm³', 180),
  line('boq-1-2', 'materials', 'Steel rebar', 1.8, 'ton', 850),
  line('boq-1-3', 'materials', 'Concrete blocks', 1400, 'block', 1.2),
  line('boq-1-4', 'labor', 'Masonry crew', 30, 'day', 45),
  line('boq-1-5', 'labor', 'Structural engineer supervision', 12, 'day', 90),
  line('boq-1-6', 'equipment', 'Concrete mixer rental', 8, 'day', 60),
];

const estimate2Items: BoqItem[] = [
  line('boq-2-1', 'materials', 'HDPE water pipe (110mm)', 320, 'm', 14),
  line('boq-2-2', 'materials', 'Pipe fittings and valves', 1, 'lot', 1800),
  line('boq-2-3', 'labor', 'Trenching and laying crew', 18, 'day', 40),
  line('boq-2-4', 'equipment', 'Excavator rental', 5, 'day', 220),
  line('boq-2-5', 'custom', 'Municipal connection permit', 1, 'permit', 400),
];

const estimate4Items: BoqItem[] = [
  line('boq-4-1', 'materials', 'Roof timber and trusses', 6, 'm³', 320),
  line('boq-4-2', 'materials', 'Corrugated roofing sheets', 90, 'm²', 22),
  line('boq-4-3', 'materials', 'Insulation board', 90, 'm²', 9),
  line('boq-4-4', 'labor', 'Roofing crew', 14, 'day', 45),
  line('boq-4-5', 'equipment', 'Mobile crane (half-day)', 2, 'day', 140),
];

const estimate5Items: BoqItem[] = [
  line('boq-5-1', 'materials', 'Cement (bagged)', 400, 'bag', 8),
  line('boq-5-2', 'labor', 'General labour', 40, 'day', 35),
  line('boq-5-3', 'equipment', 'Debris skip hire', 6, 'skip', 90),
];

function totals(items: BoqItem[], discounts: number): Pick<Estimate, 'subtotal' | 'discounts' | 'tax' | 'total' | 'fundingRequired'> {
  const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  const total = subtotal - discounts;
  return { subtotal, discounts, tax: 0, total, fundingRequired: total };
}

export const seedEstimates: Estimate[] = [
  {
    id: 'estimate-1',
    estimateNumber: 'EST-2026-00051',
    projectId: 'project-1',
    projectTitle: 'Al-Najjar Family Home Reconstruction',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    status: 'approved',
    items: estimate1Items,
    ...totals(estimate1Items, 300),
    fundedAmount: 5200,
    createdAt: '2026-03-25T09:00:00.000Z',
    approvedAt: '2026-03-28T09:00:00.000Z',
  },
  {
    id: 'estimate-2',
    estimateNumber: 'EST-2026-00039',
    projectId: 'project-2',
    projectTitle: 'Deir al-Balah Water Line Restoration',
    teamId: 'team-3',
    teamName: 'Sumoud Engineering Group',
    status: 'approved',
    items: estimate2Items,
    ...totals(estimate2Items, 0),
    fundedAmount: 8760,
    createdAt: '2025-12-18T09:00:00.000Z',
    approvedAt: '2025-12-20T09:00:00.000Z',
  },
  {
    id: 'estimate-3',
    estimateNumber: 'EST-2026-00090',
    projectId: 'project-3',
    projectTitle: 'Sabbah Family Home Rebuild',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    status: 'pendingApproval',
    items: estimate1Items,
    ...totals(estimate1Items, 0),
    fundedAmount: 0,
    createdAt: '2026-04-10T09:00:00.000Z',
  },
  {
    id: 'estimate-4',
    estimateNumber: 'EST-2026-00104',
    projectId: 'project-4',
    projectTitle: 'Owda Home Roof Replacement',
    teamId: 'team-4',
    teamName: 'Rafah Rebuild Workshop',
    status: 'pendingApproval',
    items: estimate4Items,
    ...totals(estimate4Items, 150),
    fundedAmount: 0,
    createdAt: '2026-07-16T09:00:00.000Z',
  },
  {
    id: 'estimate-5',
    estimateNumber: 'EST-2026-00097',
    projectId: 'project-5',
    projectTitle: 'Barghouth Home Debris Clearance',
    teamId: 'team-2',
    teamName: 'Gaza Restoration Guild',
    status: 'rejected',
    items: estimate5Items,
    ...totals(estimate5Items, 0),
    fundedAmount: 0,
    rejectionReason: 'Labour day-rate is well above the approved reconstruction schedule; resubmit at the standard rate.',
    createdAt: '2026-06-22T09:00:00.000Z',
  },
];
