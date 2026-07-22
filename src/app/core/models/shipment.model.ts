import { ShipmentStatus } from './domain.constants';

/**
 * Crossings goods move through into Gaza. Transport is a tracked stage of its
 * own here precisely because clearance at these crossings is the bottleneck —
 * the legacy US portal had no such concept.
 */
export const SHIPMENT_CROSSINGS = ['keremShalom', 'rafah', 'erez'] as const;
export type ShipmentCrossing = (typeof SHIPMENT_CROSSINGS)[number];

/**
 * A truck/convoy movement of reconstruction materials from a supplier, through a
 * crossing, into a warehouse. Ports the legacy `inventory/truckOrderList`,
 * reframed around crossing clearance.
 */
export interface Shipment {
  id: string;
  shipmentNumber: string;
  /** The purchase order this shipment fulfils, if any. */
  purchaseOrderId?: string;
  poNumber?: string;
  supplierName: string;
  destinationWarehouseName: string;
  crossing: ShipmentCrossing;
  status: ShipmentStatus;
  truckCount: number;
  cargoDescription: string;
  dispatchedAt?: string;
  expectedArrival?: string;
  deliveredAt?: string;
  createdAt: string;
}
