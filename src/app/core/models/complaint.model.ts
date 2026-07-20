import { ComplaintStatus } from './domain.constants';
import { Attachment } from './shared.model';

export interface ComplaintReasons {
  delay: boolean;
  poorQuality: boolean;
  specificationMismatch: boolean;
  misconduct: boolean;
  otherReason: boolean;
  otherReasonDetail?: string;
}

export interface Complaint {
  id: string;
  complaintNumber: string;
  teamId: string;
  teamName: string;
  projectId?: string;
  description: string;
  reasons: ComplaintReasons;
  attachments: Attachment[];
  status: ComplaintStatus;
  responseBody?: string;
  createdAt: string;
}
