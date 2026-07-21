import { Inspection, InspectionItem, WorkOrder } from '@core/models';
import { InspectionKind } from '@core/models';

/**
 * Blank checklist templates. A work order starts an inspection by cloning the
 * template for its kind; the legacy portal stored these server-side keyed by
 * category, but a single reconstruction checklist per kind is enough here.
 */
function preWorkTemplate(): InspectionItem[] {
  return [
    { id: 'pre-1', prompt: 'inspection.pre.siteAccess', kind: 'boolean', response: '', photoUrls: [] },
    { id: 'pre-2', prompt: 'inspection.pre.utilitiesIsolated', kind: 'boolean', response: '', photoUrls: [] },
    {
      id: 'pre-3',
      prompt: 'inspection.pre.structuralHazard',
      kind: 'choice',
      options: ['none', 'minor', 'severe'],
      response: '',
      photoUrls: [],
    },
    { id: 'pre-4', prompt: 'inspection.pre.debrisCleared', kind: 'boolean', response: '', photoUrls: [] },
    { id: 'pre-5', prompt: 'inspection.pre.notes', kind: 'text', response: '', photoUrls: [] },
  ];
}

function postWorkTemplate(): InspectionItem[] {
  return [
    { id: 'post-1', prompt: 'inspection.post.workComplete', kind: 'boolean', response: '', photoUrls: [] },
    { id: 'post-2', prompt: 'inspection.post.matchesEstimate', kind: 'boolean', response: '', photoUrls: [] },
    {
      id: 'post-3',
      prompt: 'inspection.post.finishQuality',
      kind: 'choice',
      options: ['poor', 'acceptable', 'good', 'excellent'],
      response: '',
      photoUrls: [],
    },
    { id: 'post-4', prompt: 'inspection.post.siteClean', kind: 'boolean', response: '', photoUrls: [] },
    { id: 'post-5', prompt: 'inspection.post.beneficiaryPresent', kind: 'boolean', response: '', photoUrls: [] },
    { id: 'post-6', prompt: 'inspection.post.notes', kind: 'text', response: '', photoUrls: [] },
  ];
}

/** Exposed so the handler can start an inspection from the correct template. */
export function inspectionTemplate(kind: InspectionKind): InspectionItem[] {
  return kind === 'preWork' ? preWorkTemplate() : postWorkTemplate();
}

function completedPreWork(): Inspection {
  const items = preWorkTemplate();
  items[0]!.response = 'true';
  items[1]!.response = 'true';
  items[2]!.response = 'minor';
  items[3]!.response = 'true';
  items[4]!.response = 'Ground floor accessible; upper slab braced before entry.';
  return {
    kind: 'preWork',
    items,
    notes: 'Cleared to begin structural repair.',
    inspectorName: 'Rami Qudaih',
    signatureUrl: '',
    completedAt: '2026-05-02T08:30:00.000Z',
  };
}

export const seedWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    workOrderNumber: 'WO-2026-00071',
    title: 'Structural repair — Al-Najjar home',
    status: 'inProgress',
    priority: 'high',
    projectId: 'project-1',
    projectTitle: 'Al-Najjar Family Home Reconstruction',
    requestId: 'request-1',
    estimateId: 'estimate-1',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    primaryStaffName: 'Rami Qudaih',
    contactName: 'Youssef Al-Najjar',
    contactPhone: '+970591234567',
    address: { governorate: 'northGaza', district: 'Beit Lahia', streetDescription: 'Near the old water tower' },
    scheduledFor: '2026-05-02T07:00:00.000Z',
    createdAt: '2026-04-29T09:00:00.000Z',
    preWorkInspection: completedPreWork(),
  },
  {
    id: 'wo-2',
    workOrderNumber: 'WO-2026-00068',
    title: 'Water line restoration — Deir al-Balah',
    status: 'completed',
    priority: 'normal',
    projectId: 'project-2',
    projectTitle: 'Deir al-Balah Water Line Restoration',
    requestId: 'request-2',
    estimateId: 'estimate-2',
    teamId: 'team-3',
    teamName: 'Sumoud Engineering Group',
    primaryStaffName: 'Hala Aql',
    contactName: 'Sami Owda',
    contactPhone: '+970594445566',
    address: { governorate: 'deirAlBalah', district: 'Al-Zawayda', streetDescription: 'Coastal road' },
    scheduledFor: '2026-01-05T07:00:00.000Z',
    createdAt: '2025-12-28T09:00:00.000Z',
    completedAt: '2026-01-22T15:00:00.000Z',
    preWorkInspection: { ...completedPreWork(), inspectorName: 'Hala Aql' },
    postWorkInspection: {
      kind: 'postWork',
      items: (() => {
        const items = postWorkTemplate();
        items[0]!.response = 'true';
        items[1]!.response = 'true';
        items[2]!.response = 'good';
        items[3]!.response = 'true';
        items[4]!.response = 'true';
        items[5]!.response = 'Handover signed by the beneficiary.';
        return items;
      })(),
      notes: 'Water pressure verified at the tap.',
      inspectorName: 'Hala Aql',
      signatureUrl: '',
      completedAt: '2026-01-22T14:45:00.000Z',
    },
  },
  {
    id: 'wo-3',
    workOrderNumber: 'WO-2026-00080',
    title: 'Roof replacement — Owda home',
    status: 'scheduled',
    priority: 'high',
    projectId: 'project-4',
    projectTitle: 'Owda Home Roof Replacement',
    requestId: 'request-3',
    teamId: 'team-4',
    teamName: 'Rafah Rebuild Workshop',
    primaryStaffName: 'Bilal Najjar',
    contactName: 'Sami Owda',
    contactPhone: '+970594445566',
    address: { governorate: 'rafah', district: 'Tal as-Sultan', streetDescription: 'West of the clinic' },
    scheduledFor: '2026-07-25T07:00:00.000Z',
    createdAt: '2026-07-17T09:00:00.000Z',
  },
  {
    id: 'wo-4',
    workOrderNumber: 'WO-2026-00082',
    title: 'Debris clearance — Barghouth home',
    status: 'dispatched',
    priority: 'urgent',
    projectId: 'project-5',
    projectTitle: 'Barghouth Home Debris Clearance',
    requestId: 'request-7',
    teamId: 'team-2',
    teamName: 'Gaza Restoration Guild',
    primaryStaffName: 'Nour Salah',
    contactName: 'Khalil Abu Ramadan',
    contactPhone: '+970596223344',
    address: { governorate: 'gazaCity', district: 'Al-Daraj', streetDescription: 'Near the old market' },
    scheduledFor: '2026-07-22T06:30:00.000Z',
    createdAt: '2026-07-19T09:00:00.000Z',
  },
  {
    id: 'wo-5',
    workOrderNumber: 'WO-2026-00060',
    title: 'Finishing works — Community centre',
    status: 'onHold',
    priority: 'normal',
    projectId: 'project-6',
    projectTitle: 'Jabalia Community Centre Restoration',
    requestId: 'request-11',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    primaryStaffName: 'Rami Qudaih',
    contactName: 'Local Council',
    contactPhone: '+970591667788',
    address: { governorate: 'northGaza', district: 'Jabalia', streetDescription: 'Beside the UNRWA school' },
    scheduledFor: '2026-06-01T07:00:00.000Z',
    createdAt: '2026-05-20T09:00:00.000Z',
    preWorkInspection: { ...completedPreWork(), inspectorName: 'Rami Qudaih' },
  },
];
