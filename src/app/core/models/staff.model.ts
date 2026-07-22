export const STAFF_STATUSES = ['active', 'onLeave', 'inactive'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

/** A clock-in/out entry on a staff member's timecard. */
export interface TimecardEntry {
  id: string;
  date: string;
  /** Hours worked that day. */
  hours: number;
  projectTitle?: string;
}

/**
 * A field staff member belonging to a contracting team — port of the legacy
 * `staff` records. The back office sees who is on each team, their trade, and
 * their recent time on site.
 */
export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  /** Trade / job title, e.g. "Site engineer". */
  jobTitle: string;
  teamId: string;
  teamName: string;
  status: StaffStatus;
  joinedAt: string;
  timecard: TimecardEntry[];
}
