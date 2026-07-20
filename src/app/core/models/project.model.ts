import { ProjectPhaseKey, ProjectStatus } from './domain.constants';
import { Address, Attachment } from './shared.model';

export interface ProjectPhase {
  key: ProjectPhaseKey;
  order: number;
  status: 'pending' | 'inProgress' | 'completed';
  completionPercent: number;
  startedAt?: string;
  completedAt?: string;
  responsibleName?: string;
  photos: Attachment[];
}

export interface ProjectTimelineEntry {
  id: string;
  phaseKey: ProjectPhaseKey;
  note: string;
  createdAt: string;
  photos: Attachment[];
}

export interface Project {
  id: string;
  projectNumber: string;
  title: string;
  status: ProjectStatus;
  address: Address;
  teamId: string;
  teamName: string;
  requestId: string;
  currentPhaseKey: ProjectPhaseKey;
  overallCompletionPercent: number;
  damagePhotos: Attachment[];
  progressPhotos: Attachment[];
  documents: Attachment[];
  phases: ProjectPhase[];
  timeline: ProjectTimelineEntry[];
  createdAt: string;
}
