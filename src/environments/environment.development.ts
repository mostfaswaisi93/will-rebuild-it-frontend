export const environment = {
  production: false,
  appName: 'منصة إعمار غزة',
  apiUrl: '/api',
  useMockApi: true,
  defaultLocale: 'ar' as const,
  stripePublishableKey: '',
  /** Beneficiaries and donors sign in here but live in the separate customer app. */
  customerPortalUrl: 'http://localhost:4200',
};
