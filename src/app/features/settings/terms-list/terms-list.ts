import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucidePencil, LucidePlus } from '@lucide/angular';
import { TERMS_AUDIENCES, TermsAudience, TermsDocument } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SettingsApi } from '@core/api/settings-api.service';
import { ToastService } from '@core/toast/toast.service';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { TermsDialog, TermsDialogData } from '../terms-dialog/terms-dialog';

interface AudienceGroup {
  audience: TermsAudience;
  docs: TermsDocument[];
}

/**
 * Terms & Conditions manager — port of the legacy `termsAndConditions` setting.
 * Documents are grouped by audience so the active version for each is obvious;
 * activating one deactivates the others in its group.
 */
@Component({
  selector: 'app-terms-list',
  imports: [LucidePencil, LucidePlus, TranslatePipe, PageHeader],
  templateUrl: './terms-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsList {
  private readonly api = inject(SettingsApi);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({ stream: () => this.api.listTerms() });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  private readonly docs = computed<TermsDocument[]>(() => this.resource.value() ?? []);

  protected readonly groups = computed<AudienceGroup[]>(() =>
    TERMS_AUDIENCES.map((audience) => ({
      audience,
      docs: this.docs().filter((doc) => doc.audience === audience),
    })).filter((group) => group.docs.length > 0),
  );

  protected add(): void {
    this.openDialog({});
  }

  protected edit(doc: TermsDocument): void {
    this.openDialog({ doc });
  }

  private openDialog(data: TermsDialogData): void {
    this.dialog
      .open<TermsDocument, TermsDialogData>(TermsDialog, { data })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this.toast.success(data.doc ? 'settings.terms.updated' : 'settings.terms.created');
          this.resource.reload();
        }
      });
  }

  protected activate(doc: TermsDocument): void {
    if (doc.active) {
      return;
    }
    this.api
      .activateTerms(doc.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (all) => {
          this.resource.set(all);
          this.toast.success('settings.terms.activated');
        },
        error: () => this.toast.danger('common.errorGeneric'),
      });
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
