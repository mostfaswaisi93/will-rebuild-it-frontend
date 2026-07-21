import { DamageSeverity, PropertyType, RequestOrigin, RequestStatus, RequestType } from './domain.constants';
import { Address, Attachment } from './shared.model';

export interface AssessmentOption {
  id: string;
  label: string;
  nextQuestionId?: string;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  inputType: 'radio' | 'checkbox' | 'dropdown' | 'date' | 'number' | 'text';
  options?: AssessmentOption[];
}

export interface AssessmentAnswer {
  questionId: string;
  value: string | string[] | number;
}

export interface DamageReport {
  propertyType: PropertyType;
  severity: DamageSeverity;
  description: string;
  attachments: Attachment[];
  address: Address;
  answers: AssessmentAnswer[];
}

export interface MatchedTeam {
  teamId: string;
  teamName: string;
  teamLogoUrl?: string;
  matchScore: number;
  status: 'suggested' | 'assigned';
}

export interface ReconstructionRequest {
  id: string;
  requestNumber: string;
  type: RequestType;
  status: RequestStatus;
  propertyType: PropertyType;
  severity: DamageSeverity;
  description: string;
  address: Address;
  attachments: Attachment[];
  contactName: string;
  contactPhone: string;
  assignedTeamId?: string;
  matchedTeams: MatchedTeam[];
  createdAt: string;
  /**
   * How the request entered the system. `beneficiaryPortal` is the self-service
   * assessment funnel; `directBooking` is an operator logging it for a
   * beneficiary who called or walked in (the legacy "direct booking lead").
   * Absent on older records is treated as `beneficiaryPortal`.
   */
  origin?: RequestOrigin;
}
