import {
  MaterialCategory,
  PurchaseOrderStatus,
  StockStatus,
  UnitOfMeasure,
} from './domain.constants';

export interface Warehouse {
  id: string;
  name: string;
  governorate: string;
  district: string;
  managerName: string;
  createdAt: string;
}

/**
 * On-hand stock of one material at one warehouse. `status` is derived from the
 * quantity against `reorderLevel`, so the list can flag what needs restocking
 * without a separate field to keep in sync.
 */
export interface StockItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  description: string;
  category: MaterialCategory;
  unit: UnitOfMeasure | string;
  quantityOnHand: number;
  reorderLevel: number;
  status: StockStatus;
}

export interface PurchaseOrderLine {
  id: string;
  description: string;
  category: MaterialCategory;
  quantity: number;
  unit: UnitOfMeasure | string;
  unitRate: number;
  amount: number;
}

/**
 * A purchase order raised to a supplier for reconstruction materials, delivered
 * into a warehouse. Ports the legacy `purchaseOrder` but drops the marketplace
 * plumbing; the flow is draft → approval → ordered → received.
 */
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  subtotal: number;
  currency: string;
  expectedDelivery?: string;
  createdAt: string;
  approvedAt?: string;
  receivedAt?: string;
}
