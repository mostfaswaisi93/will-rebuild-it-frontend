import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationPreferences, ProfileApi } from '@core/api/profile-api.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';
import { ConfirmDialog } from '@shared/ui/confirm-dialog/confirm-dialog';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { PageHeader } from '@shared/ui/page-header/page-header';

/** The four preference switches, in the order the legacy screen listed them. */
const PREF_KEYS = [
  'projectUpdates',
  'fundingUpdates',
  'teamMessages',
  'donationReceipts',
] as const;
type PrefKey = (typeof PREF_KEYS)[number];

type Tab = 'data' | 'notifications';

/**
 * Personal account settings — port of the legacy `accountSettings/:tab`. That
 * screen was a tabbed container over lookup editors; those lookups are typed
 * constants here (see `/app/global-settings/reference`), so what remains is
 * what the tab set was actually for: how the user's data is used, and which
 * notifications they receive.
 */
@Component({
  selector: 'app-account-settings',
  imports: [TranslatePipe, PageHeader],
  templateUrl: './account-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettings {
  private readonly api = inject(ProfileApi);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly prefKeys = PREF_KEYS;
  protected readonly tab = signal<Tab>('data');
  protected readonly saving = signal(false);

  private readonly resource = rxResource({
    stream: () => this.api.getNotificationPreferences(),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);

  /** Local working copy so toggles stay responsive before the save round-trip. */
  private readonly draft = signal<NotificationPreferences | null>(null);

  protected readonly prefs = computed<NotificationPreferences | null>(
    () => this.draft() ?? this.resource.value() ?? null,
  );

  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
  }

  protected isOn(key: PrefKey): boolean {
    return this.prefs()?.[key] ?? false;
  }

  protected toggle(key: PrefKey): void {
    const current = this.prefs();
    if (!current) {
      return;
    }
    this.draft.set({ ...current, [key]: !current[key] });
  }

  protected save(): void {
    const prefs = this.prefs();
    if (!prefs || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.api
      .updateNotificationPreferences(prefs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.draft.set(null);
          this.resource.set(saved);
          this.toast.success('account.notifications.saved');
        },
        error: () => {
          this.saving.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected deactivate(): void {
    this.dialog
      .open<boolean>(ConfirmDialog, {
        data: {
          titleKey: 'account.deactivate.confirmTitle',
          bodyKey: 'account.deactivate.confirmBody',
          confirmKey: 'account.deactivate.confirmButton',
          tone: 'danger',
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          // No deactivation endpoint exists; the copy frames this as a request
          // the support team picks up, which is what the mock can honestly do.
          this.toast.success('account.deactivate.done');
        }
      });
  }
}
