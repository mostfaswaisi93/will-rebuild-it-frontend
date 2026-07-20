import { SupportStatus } from './domain.constants';

export interface SupportMessage {
  id: string;
  author: 'beneficiary' | 'support';
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  projectId?: string;
  projectTitle?: string;
  subject: string;
  description: string;
  status: SupportStatus;
  messages: SupportMessage[];
  createdAt: string;
}
