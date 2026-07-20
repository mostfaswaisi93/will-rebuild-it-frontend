import { Project, ProjectPhase, ProjectPhaseKey, ProjectTimelineEntry, PROJECT_PHASE_KEYS } from '@core/models';

const PHASE_RESPONSIBLE: Record<ProjectPhaseKey, string> = {
  damageAssessment: 'Site engineer',
  debrisRemoval: 'Site crew lead',
  designAndPermits: 'Structural engineer',
  foundation: 'Foundation crew lead',
  structure: 'Site engineer',
  finishing: 'Finishing crew lead',
  handover: 'Project manager',
};

function buildPhases(activeIndex: number, activePercent: number, startDate: string): ProjectPhase[] {
  const start = new Date(startDate).getTime();
  const dayMs = 1000 * 60 * 60 * 24;

  return PROJECT_PHASE_KEYS.map((key, index) => {
    const isCompleted = index < activeIndex;
    const isActive = index === activeIndex;
    return {
      key,
      order: index + 1,
      status: isCompleted ? 'completed' : isActive ? 'inProgress' : 'pending',
      completionPercent: isCompleted ? 100 : isActive ? activePercent : 0,
      startedAt: isCompleted || isActive ? new Date(start + index * 18 * dayMs).toISOString() : undefined,
      completedAt: isCompleted ? new Date(start + (index + 1) * 18 * dayMs).toISOString() : undefined,
      responsibleName: isCompleted || isActive ? PHASE_RESPONSIBLE[key] : undefined,
      photos: [],
    };
  });
}

function buildTimeline(projectId: string, entries: [ProjectPhaseKey, string, string][]): ProjectTimelineEntry[] {
  return entries.map(([phaseKey, note, createdAt], index) => ({
    id: `${projectId}-timeline-${index + 1}`,
    phaseKey,
    note,
    createdAt,
    photos: [],
  }));
}

export const seedProjects: Project[] = [
  {
    id: 'project-1',
    projectNumber: 'PRJ-2026-00071',
    title: 'Al-Najjar Family Home Reconstruction',
    status: 'active',
    address: { governorate: 'northGaza', district: 'Beit Lahia', streetDescription: 'Near the old water tower' },
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    requestId: 'request-1',
    currentPhaseKey: 'structure',
    overallCompletionPercent: 58,
    damagePhotos: [],
    progressPhotos: [],
    documents: [],
    phases: buildPhases(4, 45, '2026-02-20T08:00:00.000Z'),
    timeline: buildTimeline('project-1', [
      ['damageAssessment', 'Initial structural assessment completed; second floor confirmed unsafe.', '2026-02-22T08:00:00.000Z'],
      ['debrisRemoval', 'Collapsed second-floor debris cleared and sorted for reuse.', '2026-03-10T08:00:00.000Z'],
      ['designAndPermits', 'Reinforcement plan approved by structural engineer.', '2026-03-28T08:00:00.000Z'],
      ['foundation', 'Ground-floor foundation reinforced along the northern wall.', '2026-04-15T08:00:00.000Z'],
      ['structure', 'Second-floor structural frame rebuild in progress.', '2026-05-30T08:00:00.000Z'],
    ]),
    createdAt: '2026-02-14T09:00:00.000Z',
  },
  {
    id: 'project-2',
    projectNumber: 'PRJ-2026-00042',
    title: 'Deir al-Balah Water Line Restoration',
    status: 'delivered',
    address: { governorate: 'deirAlBalah', district: 'Deir al-Balah' },
    teamId: 'team-3',
    teamName: 'Sumoud Engineering Group',
    requestId: 'request-2',
    currentPhaseKey: 'handover',
    overallCompletionPercent: 100,
    damagePhotos: [],
    progressPhotos: [],
    documents: [],
    phases: buildPhases(7, 0, '2025-11-10T08:00:00.000Z'),
    timeline: buildTimeline('project-2', [
      ['damageAssessment', 'Full line survey completed across the affected block.', '2025-11-12T08:00:00.000Z'],
      ['debrisRemoval', 'Damaged pipe sections removed.', '2025-12-01T08:00:00.000Z'],
      ['designAndPermits', 'Replacement route approved with municipal utility office.', '2025-12-20T08:00:00.000Z'],
      ['foundation', 'Trenching and bedding complete.', '2026-01-10T08:00:00.000Z'],
      ['structure', 'New line laid and pressure-tested.', '2026-02-05T08:00:00.000Z'],
      ['finishing', 'Surface reinstatement and household reconnections complete.', '2026-02-25T08:00:00.000Z'],
      ['handover', 'Service restored to all 40 households; handover signed.', '2026-03-05T08:00:00.000Z'],
    ]),
    createdAt: '2025-11-03T09:00:00.000Z',
  },
  {
    id: 'project-3',
    projectNumber: 'PRJ-2026-00089',
    title: 'Sabbah Family Home Rebuild',
    status: 'active',
    address: { governorate: 'northGaza', district: 'Jabalia' },
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    requestId: 'request-3',
    currentPhaseKey: 'foundation',
    overallCompletionPercent: 26,
    damagePhotos: [],
    progressPhotos: [],
    documents: [],
    phases: buildPhases(3, 30, '2026-03-08T08:00:00.000Z'),
    timeline: buildTimeline('project-3', [
      ['damageAssessment', 'Site confirmed as total loss; rebuild plan required.', '2026-03-10T08:00:00.000Z'],
      ['debrisRemoval', 'Site cleared and leveled.', '2026-03-25T08:00:00.000Z'],
      ['designAndPermits', 'New single-story design approved with the family.', '2026-04-12T08:00:00.000Z'],
    ]),
    createdAt: '2026-03-01T09:00:00.000Z',
  },
  {
    id: 'project-4',
    projectNumber: 'PRJ-2026-00103',
    title: 'Owda Greenhouse Restoration',
    status: 'onHold',
    address: { governorate: 'rafah', district: 'Rafah' },
    teamId: 'team-4',
    teamName: 'Rafah Rebuild Workshop',
    requestId: 'request-5',
    currentPhaseKey: 'debrisRemoval',
    overallCompletionPercent: 12,
    damagePhotos: [],
    progressPhotos: [],
    documents: [],
    phases: buildPhases(1, 20, '2026-04-25T08:00:00.000Z'),
    timeline: buildTimeline('project-4', [
      ['damageAssessment', 'Damage assessment complete; irrigation system needs full replacement.', '2026-04-27T08:00:00.000Z'],
      ['debrisRemoval', 'Debris clearance paused pending replacement material delivery.', '2026-05-15T08:00:00.000Z'],
    ]),
    createdAt: '2026-04-18T09:00:00.000Z',
  },
];
