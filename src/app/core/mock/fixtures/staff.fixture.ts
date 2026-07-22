import { StaffMember, TimecardEntry } from '@core/models';

function timecard(prefix: string, days: { date: string; hours: number; project?: string }[]): TimecardEntry[] {
  return days.map((day, index) => ({
    id: `${prefix}-tc-${index}`,
    date: day.date,
    hours: day.hours,
    projectTitle: day.project,
  }));
}

export const seedStaff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Rami Qudaih',
    phone: '+970599556677',
    email: 'staff@example.com',
    jobTitle: 'Site engineer',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    status: 'active',
    joinedAt: '2026-01-18T08:00:00.000Z',
    timecard: timecard('staff-1', [
      { date: '2026-07-20', hours: 8, project: 'Al-Najjar Family Home Reconstruction' },
      { date: '2026-07-19', hours: 7.5, project: 'Al-Najjar Family Home Reconstruction' },
      { date: '2026-07-18', hours: 8, project: 'Jabalia Community Centre Restoration' },
    ]),
  },
  {
    id: 'staff-2',
    name: 'Huda Skaik',
    phone: '+970598112200',
    jobTitle: 'Foreman',
    teamId: 'team-1',
    teamName: 'Amal Builders Cooperative',
    status: 'active',
    joinedAt: '2026-02-02T08:00:00.000Z',
    timecard: timecard('staff-2', [
      { date: '2026-07-20', hours: 8 },
      { date: '2026-07-19', hours: 8 },
    ]),
  },
  {
    id: 'staff-3',
    name: 'Yassin Habib',
    phone: '+970597334411',
    email: 'yassin@example.com',
    jobTitle: 'Electrician',
    teamId: 'team-3',
    teamName: 'Sumoud Engineering Group',
    status: 'onLeave',
    joinedAt: '2025-12-10T08:00:00.000Z',
    timecard: timecard('staff-3', [{ date: '2026-07-10', hours: 6 }]),
  },
  {
    id: 'staff-4',
    name: 'Aya Mansour',
    phone: '+970596778822',
    jobTitle: 'Quantity surveyor',
    teamId: 'team-2',
    teamName: 'Gaza Restoration Guild',
    status: 'active',
    joinedAt: '2026-03-15T08:00:00.000Z',
    timecard: timecard('staff-4', [
      { date: '2026-07-20', hours: 7 },
      { date: '2026-07-17', hours: 8 },
    ]),
  },
  {
    id: 'staff-5',
    name: 'Omar Dib',
    phone: '+970595220099',
    jobTitle: 'Mason',
    teamId: 'team-4',
    teamName: 'Rafah Rebuild Workshop',
    status: 'inactive',
    joinedAt: '2025-11-20T08:00:00.000Z',
    timecard: [],
  },
];
