import { GeoArea, GlobalSettings } from '@core/models';

export const seedGeoAreas: GeoArea[] = [
  { id: 'geo-1', governorate: 'northGaza', district: 'Beit Lahia' },
  { id: 'geo-2', governorate: 'northGaza', district: 'Jabalia' },
  { id: 'geo-3', governorate: 'gazaCity', district: 'Al-Rimal' },
  { id: 'geo-4', governorate: 'gazaCity', district: 'Al-Shujaiya' },
  { id: 'geo-5', governorate: 'deirAlBalah', district: 'Deir al-Balah' },
  { id: 'geo-6', governorate: 'deirAlBalah', district: 'Al-Nuseirat' },
  { id: 'geo-7', governorate: 'khanYounis', district: 'Khan Younis' },
  { id: 'geo-8', governorate: 'khanYounis', district: 'Bani Suheila' },
  { id: 'geo-9', governorate: 'rafah', district: 'Rafah' },
  { id: 'geo-10', governorate: 'rafah', district: 'Tel al-Sultan' },
];

export const seedGlobalSettings: GlobalSettings = {
  termsBody:
    'By using the Gaza Reconstruction Platform you agree to provide accurate information and to treat reconstruction teams and fellow users with respect.',
  privacyBody:
    'Beneficiary data — family details, identity documents, property location, and damage photos — is sensitive. We collect the minimum necessary, encrypt data in transit, restrict access by role, and never share personal identifiers publicly without explicit consent.',
  supportPhone: '+970 59 000 0000',
  supportEmail: 'support@gazareconstruction.org',
};
