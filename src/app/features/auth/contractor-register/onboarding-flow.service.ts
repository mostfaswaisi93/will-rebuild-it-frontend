import { Injectable, computed, signal } from '@angular/core';
import { BusinessType, ContractorTrade, GazaGovernorate } from '@core/models';

export interface BusinessDetails {
  businessName: string;
  businessType: BusinessType | '';
  /** Ministry of National Economy registration number; blank for a sole trader. */
  registrationNumber: string;
  trades: ContractorTrade[];
}

export interface IdentityDetails {
  /** Palestinian national ID — exactly 9 digits. */
  nationalId: string;
  dateOfBirth: string;
}

export interface LocationDetails {
  /** Where the business is based. */
  governorate: GazaGovernorate | '';
  /** Neighbourhood / area within the governorate. */
  area: string;
  streetAddress: string;
  /** Number that receives new reconstruction requests. */
  contactPhone: string;
  /**
   * Governorates the contractor will actually take work in — the legacy
   * `serviceArea`. Always includes the home governorate.
   */
  servedGovernorates: GazaGovernorate[];
  latitude: number | null;
  longitude: number | null;
}

export interface TradeLicence {
  /** Issuing body / licence name. */
  name: string;
  number: string;
  /** ISO date; licences expire and an expired one must not read as valid. */
  expiresOn: string;
}

export interface CapacityDetails {
  employeeCount: number | null;
  /** Trucks, excavators, mixers — the legacy `noOftrucks`. */
  vehicleCount: number | null;
  /** Year the business started operating. */
  foundedYear: number | null;
  summary: string;
}

export interface CredentialsDetails {
  licences: TradeLicence[];
  /** Legacy `isInsured` / `isBonded` / `isWarrantyOffered` / `isEstimatesFree`
   * / `isCreditCardAccepted`, which were 'Yes'/'No' strings. */
  isInsured: boolean;
  hasPerformanceBond: boolean;
  offersWarranty: boolean;
  freeEstimates: boolean;
  acceptsBankTransfer: boolean;
}

/**
 * State for the contractor onboarding wizard.
 *
 * The legacy `ProRegistrationComponent` held all of this in one 1,900-line
 * component with four `FormGroup`s and ~30 boolean flags, gated by `mode`
 * (`VANLYNK` / `LEADGEN`) rather than by step. Splitting the data by step keeps
 * each screen's validation local and makes "can I reach step N?" answerable.
 *
 * Held in memory only, like `PasswordResetFlow`: nothing here should survive a
 * reload as a partially-submitted application.
 */
@Injectable()
export class OnboardingFlow {
  readonly business = signal<BusinessDetails | null>(null);
  readonly identity = signal<IdentityDetails | null>(null);
  readonly location = signal<LocationDetails | null>(null);
  readonly capacity = signal<CapacityDetails | null>(null);
  readonly credentials = signal<CredentialsDetails | null>(null);

  readonly hasBusiness = computed(() => this.business() !== null);
  readonly hasIdentity = computed(() => this.hasBusiness() && this.identity() !== null);
  readonly hasLocation = computed(() => this.hasIdentity() && this.location() !== null);
  readonly hasCapacity = computed(() => this.hasLocation() && this.capacity() !== null);
  readonly hasCredentials = computed(() => this.hasCapacity() && this.credentials() !== null);

  setBusiness(details: BusinessDetails): void {
    this.business.set(details);
  }

  setIdentity(details: IdentityDetails): void {
    this.identity.set(details);
  }

  setLocation(details: LocationDetails): void {
    this.location.set(details);
  }

  setCapacity(details: CapacityDetails): void {
    this.capacity.set(details);
  }

  setCredentials(details: CredentialsDetails): void {
    this.credentials.set(details);
  }

  reset(): void {
    this.business.set(null);
    this.identity.set(null);
    this.location.set(null);
    this.capacity.set(null);
    this.credentials.set(null);
  }
}
