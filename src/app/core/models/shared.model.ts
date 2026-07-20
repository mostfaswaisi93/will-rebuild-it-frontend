import { GazaGovernorate } from './domain.constants';

export interface Address {
  governorate: GazaGovernorate;
  district: string;
  streetDescription?: string;
  latitude?: number;
  longitude?: number;
}

export interface GeoArea {
  id: string;
  governorate: GazaGovernorate;
  district: string;
  boundary?: [number, number][];
}

export interface PageRequest {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
}

export interface GlobalSettings {
  termsBody: string;
  privacyBody: string;
  supportPhone: string;
  supportEmail: string;
}

export interface Attachment {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
}
