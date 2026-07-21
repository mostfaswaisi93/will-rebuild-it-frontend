export const TERMS_AUDIENCES = ['general', 'contractor', 'beneficiary'] as const;
export type TermsAudience = (typeof TERMS_AUDIENCES)[number];

/**
 * A versioned terms-of-use document. The activation and onboarding flows show
 * the currently-active document for their audience; older versions are kept
 * (never deleted) so a record survives of exactly what a user accepted and
 * when. Ports the legacy `termsAndConditions` settings.
 */
export interface TermsDocument {
  id: string;
  title: string;
  audience: TermsAudience;
  /** Human version label, e.g. "v2.1". */
  version: string;
  body: string;
  /** Exactly one document per audience is active at a time. */
  active: boolean;
  updatedAt: string;
}
