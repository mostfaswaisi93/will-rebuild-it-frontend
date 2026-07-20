import {
  CurrencyCode,
  DamageSeverity,
  GazaGovernorate,
  ProjectPhaseKey,
  ProjectStatus,
  RequestStatus,
} from '@core/models';

/** One row in a dashboard's "needs attention" list. */
export interface DashboardRequestRow {
  id: string;
  requestNumber: string;
  governorate: GazaGovernorate | '';
  severity: DamageSeverity;
  status: RequestStatus;
  createdAt: string;
}

export interface DashboardProjectRow {
  id: string;
  projectNumber: string;
  title: string;
  status: ProjectStatus;
  currentPhaseKey: ProjectPhaseKey;
  overallCompletionPercent: number;
  teamName: string;
}

export interface AdminDashboardDto {
  activeProjects: number;
  openRequests: number;
  registeredContractors: number;
  /** Contractors whose onboarding is still incomplete — an operator queue. */
  pendingContractors: number;
  disbursedTotal: number;
  outstandingTotal: number;
  currency: CurrencyCode;
  projectsByPhase: { phaseKey: ProjectPhaseKey; count: number }[];
  recentRequests: DashboardRequestRow[];
}

export interface ContractorDashboardDto {
  assignedProjects: number;
  pendingEstimates: number;
  openRequests: number;
  outstandingAmount: number;
  currency: CurrencyCode;
  activeProjects: DashboardProjectRow[];
}

export interface StaffDashboardDto {
  assignedProjects: number;
  phasesInProgress: number;
  activeProjects: DashboardProjectRow[];
}
