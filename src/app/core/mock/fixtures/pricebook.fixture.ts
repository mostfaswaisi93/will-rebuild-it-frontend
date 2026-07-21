import { PricebookItem } from '@core/models';

function item(
  id: string,
  code: string,
  category: PricebookItem['category'],
  description: string,
  unit: string,
  unitRate: number,
  active = true,
): PricebookItem {
  return { id, code, category, description, unit, unitRate, active, updatedAt: '2026-03-01T09:00:00.000Z' };
}

export const seedPricebook: PricebookItem[] = [
  item('pb-1', 'MAT-CONC-01', 'materials', 'Reinforced concrete, structural grade', 'm³', 180),
  item('pb-2', 'MAT-STEEL-01', 'materials', 'Steel reinforcement bar', 'ton', 850),
  item('pb-3', 'MAT-BLOCK-01', 'materials', 'Hollow concrete block, 20cm', 'block', 1.2),
  item('pb-4', 'MAT-CEM-01', 'materials', 'Portland cement, bagged', 'bag', 8),
  item('pb-5', 'MAT-AGG-01', 'materials', 'Crushed aggregate', 'm³', 26),
  item('pb-6', 'MAT-PIPE-01', 'materials', 'HDPE water pipe, 110mm', 'm', 14),
  item('pb-7', 'MAT-ROOF-01', 'materials', 'Corrugated roofing sheet', 'm²', 22),
  item('pb-8', 'LAB-MASON-01', 'labor', 'Masonry crew, day rate', 'day', 45),
  item('pb-9', 'LAB-ENG-01', 'labor', 'Structural engineer supervision', 'day', 90),
  item('pb-10', 'LAB-GEN-01', 'labor', 'General labour', 'day', 35),
  item('pb-11', 'LAB-TRENCH-01', 'labor', 'Trenching and laying crew', 'day', 40),
  item('pb-12', 'EQP-MIX-01', 'equipment', 'Concrete mixer rental', 'day', 60),
  item('pb-13', 'EQP-EXC-01', 'equipment', 'Excavator rental', 'day', 220),
  item('pb-14', 'EQP-CRANE-01', 'equipment', 'Mobile crane, half-day', 'day', 140),
  // An inactive item — a superseded rate kept for historical estimates.
  item('pb-15', 'MAT-CEM-00', 'materials', 'Portland cement (2025 schedule)', 'bag', 6, false),
];
