import { InspectionKind, WorkOrderPriority, WorkOrderStatus } from './domain.constants';
import { Address } from './shared.model';

/**
 * One line on an inspection checklist. `response` is the inspector's answer;
 * `options` (semicolon-delimited in the template) drives single/multi choice,
 * empty for free text or a plain pass/fail.
 */
export interface InspectionItem {
  id: string;
  prompt: string;
  /** 'boolean' → pass/fail toggle; 'choice' → one of `options`; 'text' → note. */
  kind: 'boolean' | 'choice' | 'text';
  options?: string[];
  response: string;
  /** Field photos attached to this line, as data URLs or asset paths. */
  photoUrls: string[];
}

export interface Inspection {
  kind: InspectionKind;
  items: InspectionItem[];
  notes: string;
  inspectorName: string;
  /** Data URL of the inspector's signature; empty until signed. */
  signatureUrl: string;
  completedAt?: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  projectId: string;
  projectTitle: string;
  /** The reconstruction request this order fulfils. */
  requestId: string;
  /** The approved estimate it is costed against, if any. */
  estimateId?: string;
  teamId: string;
  teamName: string;
  /** Primary field lead responsible on site. */
  primaryStaffName: string;
  contactName: string;
  contactPhone: string;
  address: Address;
  /** ISO date the work is scheduled to start. */
  scheduledFor?: string;
  createdAt: string;
  completedAt?: string;
  /** Pre-work and post-work inspections, absent until started. */
  preWorkInspection?: Inspection;
  postWorkInspection?: Inspection;
}
