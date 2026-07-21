import {
  EquipmentCategory,
  EquipmentProblemSeverity,
  EquipmentStatus,
} from './domain.constants';

/** A block of time a machine is committed to a project/work order. */
export interface EquipmentBooking {
  id: string;
  workOrderId?: string;
  projectTitle: string;
  /** ISO dates; a booking is [from, to] inclusive of whole days. */
  from: string;
  to: string;
  bookedBy: string;
}

/** A fault raised against a machine from the field. */
export interface EquipmentProblem {
  id: string;
  severity: EquipmentProblemSeverity;
  description: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  /** Where the machine currently sits — a warehouse or a site. */
  location: string;
  dailyRate: number;
  currency: string;
  bookings: EquipmentBooking[];
  problems: EquipmentProblem[];
  createdAt: string;
}
