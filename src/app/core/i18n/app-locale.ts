export type AppLocale = 'en' | 'ar';

/**
 * Arabic is the primary locale for the reconstruction portal — beneficiaries,
 * contractors, and field staff all work in Arabic. English stays available as
 * a secondary locale for international donors and NGO partners.
 */
export const DEFAULT_LOCALE: AppLocale = 'ar';
export const LOCALE_STORAGE_KEY = 'wri-locale';
