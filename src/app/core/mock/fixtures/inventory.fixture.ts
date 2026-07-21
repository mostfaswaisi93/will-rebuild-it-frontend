import { PurchaseOrder, PurchaseOrderLine, StockItem, StockStatus, Warehouse } from '@core/models';

export const seedWarehouses: Warehouse[] = [
  {
    id: 'wh-1',
    name: 'North Gaza Central Store',
    governorate: 'northGaza',
    district: 'Jabalia',
    managerName: 'Adham Kabaja',
    createdAt: '2025-11-10T08:00:00.000Z',
  },
  {
    id: 'wh-2',
    name: 'Gaza City Materials Yard',
    governorate: 'gazaCity',
    district: 'Al-Zaytoun',
    managerName: 'Wafa Siam',
    createdAt: '2025-11-15T08:00:00.000Z',
  },
  {
    id: 'wh-3',
    name: 'Khan Younis Depot',
    governorate: 'khanYounis',
    district: 'Al-Amal',
    managerName: 'Jihad Farra',
    createdAt: '2025-12-01T08:00:00.000Z',
  },
];

/** inStock / low / outOfStock from the quantity against its reorder level. */
function stockStatus(quantity: number, reorderLevel: number): StockStatus {
  if (quantity <= 0) {
    return 'outOfStock';
  }
  return quantity <= reorderLevel ? 'low' : 'inStock';
}

function stock(
  id: string,
  warehouseId: string,
  warehouseName: string,
  code: string,
  description: string,
  category: StockItem['category'],
  unit: string,
  quantityOnHand: number,
  reorderLevel: number,
): StockItem {
  return {
    id,
    warehouseId,
    warehouseName,
    code,
    description,
    category,
    unit,
    quantityOnHand,
    reorderLevel,
    status: stockStatus(quantityOnHand, reorderLevel),
  };
}

export const seedStock: StockItem[] = [
  stock('st-1', 'wh-1', 'North Gaza Central Store', 'MAT-CEM-01', 'Portland cement, bagged', 'cement', 'bag', 1800, 400),
  stock('st-2', 'wh-1', 'North Gaza Central Store', 'MAT-STEEL-01', 'Steel reinforcement bar', 'steel', 'ton', 6, 8),
  stock('st-3', 'wh-1', 'North Gaza Central Store', 'MAT-BLOCK-01', 'Hollow concrete block', 'blocks', 'block', 0, 500),
  stock('st-4', 'wh-2', 'Gaza City Materials Yard', 'MAT-AGG-01', 'Crushed aggregate', 'aggregate', 'm³', 240, 50),
  stock('st-5', 'wh-2', 'Gaza City Materials Yard', 'MAT-PIPE-01', 'HDPE water pipe, 110mm', 'plumbing', 'm', 90, 150),
  stock('st-6', 'wh-2', 'Gaza City Materials Yard', 'MAT-ROOF-01', 'Corrugated roofing sheet', 'finishing', 'm²', 520, 100),
  stock('st-7', 'wh-3', 'Khan Younis Depot', 'MAT-INS-01', 'Insulation board', 'insulation', 'm²', 30, 80),
  stock('st-8', 'wh-3', 'Khan Younis Depot', 'MAT-TIMBER-01', 'Roof timber', 'timber', 'm³', 14, 5),
];

function line(
  id: string,
  description: string,
  category: PurchaseOrderLine['category'],
  quantity: number,
  unit: string,
  unitRate: number,
): PurchaseOrderLine {
  return { id, description, category, quantity, unit, unitRate, amount: quantity * unitRate };
}

function subtotal(lines: PurchaseOrderLine[]): number {
  return lines.reduce((sum, item) => sum + item.amount, 0);
}

const po1Lines = [
  line('pol-1-1', 'Portland cement, bagged', 'cement', 1000, 'bag', 8),
  line('pol-1-2', 'Crushed aggregate', 'aggregate', 120, 'm³', 26),
];
const po2Lines = [line('pol-2-1', 'Steel reinforcement bar', 'steel', 10, 'ton', 850)];
const po3Lines = [
  line('pol-3-1', 'HDPE water pipe, 110mm', 'plumbing', 400, 'm', 14),
  line('pol-3-2', 'Pipe fittings and valves', 'plumbing', 1, 'lot', 1800),
];

export const seedPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-00045',
    supplierId: 'sup-1',
    supplierName: 'Al-Bunyan Building Materials',
    warehouseId: 'wh-1',
    warehouseName: 'North Gaza Central Store',
    status: 'awaitingApproval',
    lines: po1Lines,
    subtotal: subtotal(po1Lines),
    currency: 'USD',
    expectedDelivery: '2026-07-28T00:00:00.000Z',
    createdAt: '2026-07-18T09:00:00.000Z',
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-00041',
    supplierId: 'sup-2',
    supplierName: 'Gaza Steel & Rebar',
    warehouseId: 'wh-1',
    warehouseName: 'North Gaza Central Store',
    status: 'ordered',
    lines: po2Lines,
    subtotal: subtotal(po2Lines),
    currency: 'USD',
    expectedDelivery: '2026-07-24T00:00:00.000Z',
    createdAt: '2026-07-12T09:00:00.000Z',
    approvedAt: '2026-07-13T09:00:00.000Z',
  },
  {
    id: 'po-3',
    poNumber: 'PO-2026-00033',
    supplierId: 'sup-4',
    supplierName: 'Rafah Plumbing & Electrical Supply',
    warehouseId: 'wh-2',
    warehouseName: 'Gaza City Materials Yard',
    status: 'received',
    lines: po3Lines,
    subtotal: subtotal(po3Lines),
    currency: 'USD',
    expectedDelivery: '2026-06-20T00:00:00.000Z',
    createdAt: '2026-06-10T09:00:00.000Z',
    approvedAt: '2026-06-11T09:00:00.000Z',
    receivedAt: '2026-06-19T09:00:00.000Z',
  },
  {
    id: 'po-4',
    poNumber: 'PO-2026-00048',
    supplierId: 'sup-1',
    supplierName: 'Al-Bunyan Building Materials',
    warehouseId: 'wh-3',
    warehouseName: 'Khan Younis Depot',
    status: 'draft',
    lines: [line('pol-4-1', 'Hollow concrete block', 'blocks', 2000, 'block', 1.2)],
    subtotal: 2400,
    currency: 'USD',
    createdAt: '2026-07-20T09:00:00.000Z',
  },
];
