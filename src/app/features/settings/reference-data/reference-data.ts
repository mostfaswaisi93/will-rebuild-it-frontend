import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CAMPAIGN_CHANNELS,
  CONTRACTOR_TRADES,
  DISBURSEMENT_METHODS,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  MATERIAL_CATEGORIES,
  TIMECARD_ACTIVITY_STATUSES,
  UNITS_OF_MEASURE,
} from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { PageHeader } from '@shared/ui/page-header/page-header';

interface ReferenceSection {
  titleKey: string;
  descriptionKey: string;
  /** Translation-key prefix each value is resolved under. */
  prefix: string;
  values: readonly string[];
}

/**
 * The platform's controlled vocabularies — the reconstruction port of the
 * legacy lookup-table editors (`unitOfMeasurements`, `vendorCategories`,
 * `paymentMethods`, `timeCardActivites`, `salesAndMarketing`).
 *
 * Deliberately read-only. In the legacy portal these were editable database
 * rows; here each one is a typed union in `domain.constants.ts` that the whole
 * app's types, status-pill contexts and translation keys are derived from.
 * Editing them at runtime could not change those types, so an editor would be
 * theatre — this presents the live values instead, which is what an operator
 * actually needs to see.
 */
@Component({
  selector: 'app-reference-data',
  imports: [TranslatePipe, PageHeader],
  templateUrl: './reference-data.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceData {
  protected readonly sections: ReferenceSection[] = [
    {
      titleKey: 'settings.reference.units',
      descriptionKey: 'settings.reference.unitsDesc',
      prefix: 'units.',
      values: UNITS_OF_MEASURE,
    },
    {
      titleKey: 'settings.reference.materials',
      descriptionKey: 'settings.reference.materialsDesc',
      prefix: 'materials.',
      values: MATERIAL_CATEGORIES,
    },
    {
      titleKey: 'settings.reference.trades',
      descriptionKey: 'settings.reference.tradesDesc',
      prefix: 'trades.',
      values: CONTRACTOR_TRADES,
    },
    {
      titleKey: 'settings.reference.paymentMethods',
      descriptionKey: 'settings.reference.paymentMethodsDesc',
      prefix: 'disbursements.method.',
      values: DISBURSEMENT_METHODS,
    },
    {
      titleKey: 'settings.reference.timecard',
      descriptionKey: 'settings.reference.timecardDesc',
      prefix: 'timecardActivities.',
      values: TIMECARD_ACTIVITY_STATUSES,
    },
    {
      titleKey: 'settings.reference.outreach',
      descriptionKey: 'settings.reference.outreachDesc',
      prefix: 'campaigns.channel.',
      values: CAMPAIGN_CHANNELS,
    },
    {
      titleKey: 'settings.reference.equipmentCategories',
      descriptionKey: 'settings.reference.equipmentCategoriesDesc',
      prefix: 'equipment.category.',
      values: EQUIPMENT_CATEGORIES,
    },
    {
      titleKey: 'settings.reference.equipmentStatuses',
      descriptionKey: 'settings.reference.equipmentStatusesDesc',
      prefix: 'shared.statusPill.equipment.',
      values: EQUIPMENT_STATUSES,
    },
  ];
}
