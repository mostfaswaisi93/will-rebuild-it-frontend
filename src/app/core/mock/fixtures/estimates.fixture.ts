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
];
