import { BoqCategory } from './estimate.model';

/**
 * One standard priced item in the reconstruction pricebook — the catalogue an
 * estimate draws its line rates from. Keeping a single source of truth for
 * rates is what lets the estimate reviewer check a claim against "the approved
 * schedule" (the phrase the legacy rejection copy used).
 *
 * The legacy pricebook mixed a material cost and a separate "lead cost"
 * (marketplace pricing); reconstruction has one authoritative unit rate, so
 * that split is gone.
 */
export interface PricebookItem {
  id: string;
  /** Human-facing catalogue code, e.g. `MAT-CONC-01`. Unique. */
  code: string;
  category: BoqCategory;
  description: string;
  unit: string;
  unitRate: number;
  /** Inactive items stay for historical estimates but aren't offered for new ones. */
  active: boolean;
  updatedAt: string;
}
